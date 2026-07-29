import os
import random
import copy
import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from torch import nn
from torch.nn import Linear, ReLU, Sequential, Dropout, BatchNorm1d
from torch_geometric.data import Data
from torch_geometric.loader import DataLoader
from torch_geometric.nn import GATv2Conv, global_max_pool, global_mean_pool
from sklearn.model_selection import KFold
from torch.utils.data import Subset, WeightedRandomSampler
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import SelectFromModel
from scipy.stats import gaussian_kde
from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem, Descriptors
from mordred import Calculator, descriptors
import joblib
import warnings
import matplotlib.pyplot as plt
import seaborn as sns


# CONFIGURATION
# [HARDCODED BEST PARAMS]
BEST_H = 128
BEST_HEADS = 8
BEST_DROP = 0.10038652981187861
BEST_LR = 0.0021038816854813207
BEST_BS = 64

CSV_FILE = "filtered_output.csv" 
TARGET_COL = "delH_fusion"
TEMP_COL = "T_K"

# TRAINING CONFIG
N_ENSEMBLE_FOLDS = 5   
EPOCHS = 200           
PATIENCE = 40          

# OUTPUTS
RESULTS_CSV = "final_training_predictions.csv" 
PLOT_PARITY = "Ensemble_Parity_Tuned.png"
PLOT_RESIDUAL = "Ensemble_Residuals_Tuned.png" 
RAW_CACHE = "raw_features_tuned.pkl"
DIMS_CACHE = "dims_tuned.pkl"
INDICES_CACHE = "indices_tuned.npy"
SCALER_CACHE = "scaler_tuned.pkl"
MODEL_PREFIX = "model_tuned_fold"

RANDOM_STATE = 42
MAX_FEATURES = 500


# UTILITIES & FEATURE GEN
def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available(): torch.cuda.manual_seed_all(seed)

RDLogger.DisableLog('rdApp.*')
warnings.filterwarnings("ignore")
mordred_calc = Calculator(descriptors, ignore_3D=True)

def get_symmetry_number(mol):
    try: return len(mol.GetSubstructMatches(mol, uniquify=False))
    except: return 1.0

def get_features_from_smiles(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if not mol: return None, None
    fp = AllChem.GetMorganFingerprintAsBitVect(mol, 2, nBits=1024)
    fp_vals = [float(b) for b in fp]
    try:
        desc = list(mordred_calc(mol).fill_missing(0.0).values())
        desc.append(get_symmetry_number(mol))
        desc.append(Descriptors.FractionCSP3(mol))
    except: return None, None
    return desc, fp_vals

def get_atom_features(atom):
    possible_atoms = ['C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'I']
    features = [0] * len(possible_atoms)
    symbol = atom.GetSymbol()
    if symbol in possible_atoms: features[possible_atoms.index(symbol)] = 1
    features += [atom.GetDegree(), atom.GetTotalNumHs(), atom.GetFormalCharge(), float(atom.GetIsAromatic())]
    hyb = atom.GetHybridization()
    features += [1.0 if hyb == t else 0.0 for t in [Chem.rdchem.HybridizationType.SP, Chem.rdchem.HybridizationType.SP2, Chem.rdchem.HybridizationType.SP3]]
    return features

def get_bond_features(bond):
    bt = bond.GetBondType()
    return [float(bt == t) for t in [Chem.rdchem.BondType.SINGLE, Chem.rdchem.BondType.DOUBLE, Chem.rdchem.BondType.TRIPLE, Chem.rdchem.BondType.AROMATIC]] + [float(bond.GetIsConjugated()), float(bond.IsInRing())]

def smiles_to_graph_data(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if not mol: return None
    x = torch.tensor([get_atom_features(a) for a in mol.GetAtoms()], dtype=torch.float)
    edge_idx, edge_attr = [], []
    for b in mol.GetBonds():
        i, j = b.GetBeginAtomIdx(), b.GetEndAtomIdx()
        feat = get_bond_features(b)
        edge_idx += [[i, j], [j, i]]
        edge_attr += [feat, feat]
    if not edge_idx: return None
    return Data(x=x, edge_index=torch.tensor(edge_idx).t().contiguous(), edge_attr=torch.tensor(edge_attr, dtype=torch.float))

def create_dataset(csv_path):
    print(f"\n[Phase 1] Processing Data...")
    df = pd.read_csv(csv_path)
    # Important: Drop NA and Reset Index so we have continuous 0..N indices
    df = df.dropna(subset=['SMILES', TARGET_COL, TEMP_COL]).reset_index(drop=True)
    
    y_vals = df[TARGET_COL].values.astype(float)
    target_stats = {'mean': y_vals.mean(), 'std': y_vals.std()}
    
    dataset, all_desc = [], []
    valid_indices = [] # Keep track of which original rows survived
    
    for i, row in df.iterrows():
        if i % 100 == 0: print(f"    Processing {i}/{len(df)}...", end='\r')
        graph = smiles_to_graph_data(row['SMILES'])
        d_vals, fp_vals = get_features_from_smiles(row['SMILES'])
        
        if graph and d_vals:
            d_vals.append(float(row[TEMP_COL])) # Add Temp
            graph.y = torch.tensor((row[TARGET_COL] - target_stats['mean']) / target_stats['std'], dtype=torch.float)
            graph.fingerprint = torch.tensor(fp_vals, dtype=torch.float)
            
            # TRACKING INDEX: Save the index 'i' in the graph object
            # We use a 1-element tensor so PyG batches it correctly
            graph.original_idx = torch.tensor([i], dtype=torch.long)
            
            dataset.append(graph)
            all_desc.append(d_vals)
            valid_indices.append(i)
            
    all_desc_np = np.nan_to_num(np.array(all_desc, dtype=float), nan=0.0)
    
    # Save the dataframe for later merging
    cache = {
        "dataset": dataset, 
        "all_desc_vals_np": all_desc_np, 
        "target_stats": target_stats,
        "source_df": df  # Save full DF to map back later
    }
    joblib.dump(cache, RAW_CACHE)
    return dataset, all_desc_np, target_stats, df

def calculate_weights(y_data):
    if len(y_data) < 10: return torch.ones(len(y_data), dtype=torch.double)
    try:
        kde = gaussian_kde(y_data)
        weights = 1.0 / kde(y_data)
        return torch.DoubleTensor(weights / weights.mean())
    except:
        return torch.ones(len(y_data), dtype=torch.double)


# MODEL ARCHITECTURE
class HybridGNN(nn.Module):
    def __init__(self, num_atom_features, num_bond_features, num_descriptor_features, 
                 hidden_dim=128, heads=4, dropout=0.1): 
        super().__init__()
        self.gnn_h = hidden_dim
        self.desc_h = hidden_dim // 2
        self.n_desc = num_descriptor_features 
        
        self.gat1 = GATv2Conv(num_atom_features, hidden_dim, heads=heads, edge_dim=num_bond_features, dropout=dropout)
        self.gat2 = GATv2Conv(hidden_dim * heads, hidden_dim, heads=1, edge_dim=num_bond_features, dropout=dropout)
        
        self.desc_net = Sequential(
            Linear(num_descriptor_features, self.desc_h), 
            ReLU(), BatchNorm1d(self.desc_h), Dropout(dropout), 
            Linear(self.desc_h, self.desc_h), ReLU()
        )
        
        dim = (hidden_dim * 2) + self.desc_h
        self.head = Sequential(
            Linear(dim, hidden_dim), ReLU(), BatchNorm1d(hidden_dim), Dropout(dropout), 
            Linear(hidden_dim, hidden_dim // 2), ReLU(), 
            Linear(hidden_dim // 2, 1)
        )

    def forward(self, data):
        x, ei, ea, b = data.x, data.edge_index, data.edge_attr, data.batch
        h = F.relu(self.gat1(x, ei, edge_attr=ea))
        h = F.relu(self.gat2(h, ei, edge_attr=ea))
        graph_emb = torch.cat([global_mean_pool(h, b), global_max_pool(h, b)], dim=1)
        
        desc_emb = self.desc_net(data.descriptors.view(-1, self.n_desc))
        
        return self.head(torch.cat([graph_emb, desc_emb], dim=1)).squeeze(-1)


# MAIN LOOP
if __name__ == "__main__":
    set_seed(RANDOM_STATE)
    dev = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Running on: {dev}")

    # 1. LOAD DATA
    if os.path.exists(RAW_CACHE):
        print(f"Loading cached clean data from {RAW_CACHE}...")
        cache = joblib.load(RAW_CACHE)
        dataset = cache["dataset"]
        all_desc_raw = cache["all_desc_vals_np"]
        stats = cache["target_stats"]
        source_df = cache["source_df"] # Load original DF
    else:
        dataset, all_desc_raw, stats, source_df = create_dataset(CSV_FILE)

    # 2. FEATURE SELECTION
    if os.path.exists(INDICES_CACHE):
        sel_idx = np.load(INDICES_CACHE)
    else:
        print("Selecting Features...")
        rf = RandomForestRegressor(n_estimators=100, n_jobs=-1, max_depth=10)
        y_all = np.array([d.y.item() for d in dataset])
        rf.fit(all_desc_raw, y_all)
        sel_idx = SelectFromModel(rf, threshold=-np.inf, max_features=MAX_FEATURES, prefit=True).get_support(indices=True)
        temp_idx = all_desc_raw.shape[1] - 1
        if temp_idx not in sel_idx: sel_idx = np.append(sel_idx, temp_idx)
        np.save(INDICES_CACHE, sel_idx)

    # 3. SCALE
    print("Scaling Features...")
    scaler = StandardScaler().fit(all_desc_raw[:, sel_idx])
    joblib.dump(scaler, SCALER_CACHE)
    desc_scaled = scaler.transform(all_desc_raw[:, sel_idx])
    
    for i, d in enumerate(dataset): 
        d.descriptors = torch.tensor(desc_scaled[i], dtype=torch.float)

    dims = {
        'num_atom_features': dataset[0].x.shape[1], 
        'num_bond_features': dataset[0].edge_attr.shape[1],
        'num_descriptor_features': desc_scaled.shape[1]
    }
    joblib.dump(dims, DIMS_CACHE)

    
    # STEP 5: FINAL ENSEMBLE TRAINING
    
    print(f"\n[Phase 3] Starting Final {N_ENSEMBLE_FOLDS}-Fold CV...")
    kfold = KFold(n_splits=N_ENSEMBLE_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    
    # Dictionary to store predictions: {original_index: prediction_value}
    final_prediction_map = {}
    
    for fold, (train_idx, val_idx) in enumerate(kfold.split(dataset)):
        print(f"\n--- Fold {fold+1}/{N_ENSEMBLE_FOLDS} ---")
        
        train_y = [dataset[i].y.item() for i in train_idx]
        sampler = WeightedRandomSampler(calculate_weights(train_y), len(train_y))
        
        train_loader = DataLoader(Subset(dataset, train_idx), batch_size=BEST_BS, sampler=sampler)
        val_loader = DataLoader(Subset(dataset, val_idx), batch_size=BEST_BS)

        model = HybridGNN(**dims, hidden_dim=BEST_H, heads=BEST_HEADS, dropout=BEST_DROP).to(dev)
        opt = torch.optim.Adam(model.parameters(), lr=BEST_LR, weight_decay=1e-5)
        
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, mode='min', factor=0.5, patience=10)
        crit = nn.SmoothL1Loss()
        
        best_val_loss = float('inf')
        best_weights = None
        pat_counter = 0

        for ep in range(1, EPOCHS+1):
            model.train()
            train_loss = 0
            for d in train_loader:
                d = d.to(dev)
                opt.zero_grad()
                loss = crit(model(d), d.y)
                loss.backward()
                opt.step()
                train_loss += loss.item()
            
            model.eval()
            val_loss = 0
            with torch.no_grad():
                for d in val_loader:
                    val_loss += crit(model(d.to(dev)), d.y).item()
            val_loss /= len(val_loader)
            
            scheduler.step(val_loss)

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                best_weights = copy.deepcopy(model.state_dict())
                pat_counter = 0
            else:
                pat_counter += 1
                if pat_counter >= PATIENCE:
                    print(f"Early stopping at epoch {ep}")
                    break
            
            if ep % 20 == 0:
                print(f"Ep {ep} | Val Loss: {val_loss:.4f} | LR: {opt.param_groups[0]['lr']:.2e}")

        # Save Fold Model
        save_path = f"{MODEL_PREFIX}_{fold}.pth"
        torch.save(best_weights, save_path)
        print(f"Saved {save_path}")
        
        # PREDICT ON VALIDATION SET FOR THIS FOLD
        model.load_state_dict(best_weights)
        model.eval()
        with torch.no_grad():
            for d in val_loader:
                d = d.to(dev)
                out = model(d)
                # Unscale
                pred_real = ((out * stats['std']) + stats['mean']).cpu().numpy()
                
                # Get Original Indices from Batch
                batch_indices = d.original_idx.cpu().numpy()
                
                # Store in map
                for idx, pred in zip(batch_indices, pred_real):
                    final_prediction_map[int(idx)] = float(pred)

    # 6. MERGE & SAVE RESULTS
    print(f"\nMerging results into {RESULTS_CSV}...")
    
    # Map predictions back to the source DataFrame using the index
    source_df['Predicted_Enthalpy'] = source_df.index.map(final_prediction_map)
    source_df['Residual'] = source_df['Predicted_Enthalpy'] - source_df[TARGET_COL]
    
    # Save CSV
    source_df.to_csv(RESULTS_CSV, index=False)
    
    # Metrics
    # Drop NAs in case something went wrong (shouldn't happen with proper CV)
    res_df = source_df.dropna(subset=['Predicted_Enthalpy'])
    
    mae = mean_absolute_error(res_df[TARGET_COL], res_df['Predicted_Enthalpy'])
    r2 = r2_score(res_df[TARGET_COL], res_df['Predicted_Enthalpy'])
    
    print(f"======================================")
    print(f"FINAL TUNED RESULTS")
    print(f"======================================")
    print(f"Mean Absolute Error: {mae:.3f} kJ/mol")
    print(f"R2 Score:            {r2:.3f}")

    # --- PLOT 1: PARITY ---
    plt.figure(figsize=(8,8))
    plt.scatter(res_df[TARGET_COL], res_df['Predicted_Enthalpy'], alpha=0.5, color='darkgreen')
    lims = [min(res_df[TARGET_COL]), max(res_df[TARGET_COL])]
    plt.plot(lims, lims, 'k--', label="Ideal")
    plt.xlabel("Actual Enthalpy (kJ/mol)")
    plt.ylabel("Predicted Enthalpy (kJ/mol)")
    plt.title(f"Parity Plot\nMAE: {mae:.2f}, R2: {r2:.3f}")
    plt.legend()
    plt.savefig(PLOT_PARITY)
    print(f"Saved {PLOT_PARITY}")
    
    # --- PLOT 2: RESIDUALS ---
    plt.figure(figsize=(10,6))
    sns.scatterplot(x='Predicted_Enthalpy', y='Residual', data=res_df, alpha=0.5, color='purple')
    plt.axhline(0, color='black', linestyle='--')
    plt.axhline(10, color='red', linestyle=':', alpha=0.5)
    plt.axhline(-10, color='red', linestyle=':', alpha=0.5)
    plt.xlabel("Predicted Value (kJ/mol)")
    plt.ylabel("Residual (Pred - Actual)")
    plt.title("Residual Plot")
    plt.savefig(PLOT_RESIDUAL)
    print(f"Saved {PLOT_RESIDUAL}")