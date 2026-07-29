"""
===============================================================================
 predict.py
 Fusion GNN Enthalpy Predictor

 LANZAR Debug Build
 - Absolute artifact paths
 - Initialization diagnostics
 - Descriptor validation
 - Fold-by-fold prediction tracing
 - Ensemble diagnostics
===============================================================================
"""

import argparse
import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from torch import nn
from torch.nn import Linear, ReLU, Sequential, Dropout, BatchNorm1d
from torch_geometric.data import Data
from torch_geometric.loader import DataLoader
from torch_geometric.nn import GATv2Conv, global_max_pool, global_mean_pool
from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem, Descriptors
from mordred import Calculator, descriptors
import joblib


HYPERPARAMS = {
    "hidden_dim": 128,
    "heads": 8,
    "dropout": 0.10038652981187861
}
# -----------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PREFIX = os.path.join(BASE_DIR, "model_tuned_fold")

N_FOLDS = 5

SCALER_PATH = os.path.join(BASE_DIR, "scaler_tuned.pkl")
INDICES_PATH = os.path.join(BASE_DIR, "indices_tuned.npy")
DIMS_PATH = os.path.join(BASE_DIR, "dims_tuned.pkl")
RAW_CACHE = os.path.join(BASE_DIR, "raw_features_tuned.pkl") # Needed for target un-scaling

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
RDLogger.DisableLog('rdApp.*')


# MODEL ARCHITECTURE

class HybridGNN(nn.Module):
    def __init__(self, num_atom_features, num_bond_features, num_descriptor_features, 
                 hidden_dim=128, heads=8, dropout=0.10038652981187861): 
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
        
        # Shape fix for batched descriptors
        desc_emb = self.desc_net(data.descriptors.view(-1, self.n_desc))
        
        return self.head(torch.cat([graph_emb, desc_emb], dim=1)).squeeze(-1)


# FEATURE GENERATION

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


# MAIN PREDICTOR CLASS
class FusionPredictor:
    def __init__(self):
        self.ready = False
        try:
            self.scaler = joblib.load(SCALER_PATH)
            self.sel_idx = np.load(INDICES_PATH)
            self.dims = joblib.load(DIMS_PATH)

            # Load stats for un-scaling target
            cache = joblib.load(RAW_CACHE)
            self.y_stats = cache['target_stats']

            print("=" * 60)
            print("Fusion Predictor Initialized")
            print("=" * 60)
            print(f"Scaler : {SCALER_PATH}")
            print(f"Indices: {INDICES_PATH}")
            print(f"Dims   : {DIMS_PATH}")
            print(f"Cache  : {RAW_CACHE}")
            print("Target Stats:", self.y_stats)
            print("=" * 60)

            self.ready = True

        except FileNotFoundError as e:
            print(f"Initialization Error: Missing artifact {e.filename}")
            print("   Make sure you run the training script first!")

    def predict_batch(self, smiles_list, temp_list):
        if not self.ready:
            return []

        # -------------------------------------------------------------
        # 1. Generate Features
        # -------------------------------------------------------------
        valid_graphs = []
        valid_indices = []

        for i, (s, t) in enumerate(zip(smiles_list, temp_list)):
            g = smiles_to_graph_data(s)
            d, _ = get_features_from_smiles(s)

            if g is not None and d is not None:

                d.append(float(t))

                d_np = np.array(d).reshape(1, -1)
                d_sel = d_np[:, self.sel_idx]
                d_scaled = self.scaler.transform(d_sel)

                g.descriptors = torch.tensor(d_scaled, dtype=torch.float)

                valid_graphs.append(g)
                valid_indices.append(i)

        if not valid_graphs:
            return [None] * len(smiles_list)

        # -------------------------------------------------------------
        # 2. Prepare Loader
        # -------------------------------------------------------------
        loader = DataLoader(valid_graphs, batch_size=32, shuffle=False)

        # -------------------------------------------------------------
        # 3. Ensemble Prediction
        # -------------------------------------------------------------
        ensemble_preds = []

        for fold in range(N_FOLDS):

            model_path = f"{MODEL_PREFIX}_{fold}.pth"

            if not os.path.exists(model_path):
                continue

            model = HybridGNN(
                num_atom_features=self.dims["num_atom_features"],
                num_bond_features=self.dims["num_bond_features"],
                num_descriptor_features=self.dims["num_descriptor_features"],
                **HYPERPARAMS
            ).to(DEVICE)

            model.load_state_dict(torch.load(model_path, map_location=DEVICE))
            model.eval()

            fold_preds = []

            with torch.no_grad():

                for batch in loader:

                    batch = batch.to(DEVICE)

                    # ============================================================
                    # TEMP DEBUG
                    # ============================================================

                    print("\n" + "=" * 70)
                    print(f"FOLD {fold}")
                    print("=" * 70)

                    print("Descriptors contain NaN :", torch.isnan(batch.descriptors).any().item())
                    print("Descriptors contain Inf :", torch.isinf(batch.descriptors).any().item())

                    print("Node Features contain NaN :", torch.isnan(batch.x).any().item())
                    print("Edge Features contain NaN :", torch.isnan(batch.edge_attr).any().item())

                    out = model(batch)

                    print("\nRaw Model Output")
                    print(out)

                    print("Raw Output contains NaN :", torch.isnan(out).any().item())
                    print("Raw Output contains Inf :", torch.isinf(out).any().item())

                    print("\nTarget Stats")
                    print(self.y_stats)

                    pred_real = (out * self.y_stats["std"]) + self.y_stats["mean"]

                    print("\nUnscaled Prediction")
                    print(pred_real)

                    print("Prediction contains NaN :", torch.isnan(pred_real).any().item())
                    print("Prediction contains Inf :", torch.isinf(pred_real).any().item())

                    print("=" * 70)

                    fold_preds.extend(pred_real.cpu().numpy())

            # Save this fold's predictions
            ensemble_preds.append(fold_preds)

        # -------------------------------------------------------------
        # 4. Aggregate Results
        # -------------------------------------------------------------
        ensemble_preds = np.array(ensemble_preds)

        mean_preds = np.mean(ensemble_preds, axis=0)
        std_preds = np.std(ensemble_preds, axis=0)

        # -------------------------------------------------------------
        # 5. Build Final Results
        # -------------------------------------------------------------
        final_results = [None] * len(smiles_list)

        for idx, list_idx in enumerate(valid_indices):
            final_results[list_idx] = {
                "Predicted_Enthalpy": mean_preds[idx],
                "Uncertainty": std_preds[idx]
            }

        return final_results
        
# CLI HANDLER
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fusion Enthalpy Predictor (Tuned Model)")
    parser.add_argument("--smiles", type=str, help="Single SMILES string")
    parser.add_argument("--temp", type=float, help="Temperature (K) for single prediction")
    parser.add_argument("--file", type=str, help="CSV file containing 'SMILES' and 'T_K' columns")
    parser.add_argument("--out", type=str, default="predictions_output.csv", help="Output filename for CSV mode")
    
    args = parser.parse_args()
    
    predictor = FusionPredictor()
    
    # MODE 1: Single Prediction
    if args.smiles and args.temp:
        print(f"\nAnalyzing Molecule: {args.smiles}")
        result = predictor.predict_batch([args.smiles], [args.temp])[0]
        
        if result:
            print("-" * 40)
            print(f"Temperature:     {args.temp} K")
            print(f"Predicted ΔH_fus: {result['Predicted_Enthalpy']:.2f} kJ/mol")
            print(f"Uncertainty:      ± {result['Uncertainty']:.2f} kJ/mol")
            print("-" * 40)
        else:
            print("Error: Could not generate features for this molecule.")

    # MODE 2: Batch CSV
    elif args.file:
        if not os.path.exists(args.file):
            print(f"Error: File {args.file} not found.")
            sys.exit(1)
            
        print(f"\nLoading {args.file}...")
        df = pd.read_csv(args.file)
        
        # Column Check
        # Handle simple case variations (T_K vs T(K) vs Temp)
        if 'SMILES' not in df.columns:
            print("Error: CSV must have a 'SMILES' column.")
            sys.exit(1)
            
        # Find Temperature column
        t_col = None
        for col in ['T_K', 'T(K)', 'Temperature', 'Temp']:
            if col in df.columns:
                t_col = col
                break
        
        if not t_col:
            print("Error: CSV must have a temperature column (e.g., 'T_K').")
            sys.exit(1)
            
        print(f"Predicting for {len(df)} molecules...")
        results = predictor.predict_batch(df['SMILES'].tolist(), df[t_col].tolist())
        
        # Add to DataFrame
        pred_vals = []
        err_vals = []
        
        for r in results:
            if r:
                pred_vals.append(r['Predicted_Enthalpy'])
                err_vals.append(r['Uncertainty'])
            else:
                pred_vals.append(None)
                err_vals.append(None)
                
        df['Predicted_DelH_Fus'] = pred_vals
        df['Uncertainty'] = err_vals
        
        df.to_csv(args.out, index=False)
        print(f"Saved results to {args.out}")

    else:
        print("Please provide arguments. Use --help for usage.")
        print("Example: python predict_final.py --smiles 'c1ccccc1' --temp 278")