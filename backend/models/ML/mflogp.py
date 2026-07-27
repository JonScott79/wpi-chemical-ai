"""
mflogp.py

MFLOGP prediction engine for the WPI chemistry API.

This module wraps the published MFLOGP machine learning model into a reusable
Python interface suitable for web APIs.

Input:
    - SMILES string
    - Molecular Formula

Output:
    {
        "formula": "...",
        "logP": float
    }
"""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import chemparse

from rdkit import Chem
from rdkit.Chem import rdMolDescriptors


# =============================================================================
# Model Loading
# =============================================================================

MODEL_DIR = Path(__file__).parent

# TEMPORARY DEBUG
print("=" * 60)
print("MODEL_DIR :", MODEL_DIR)

model_file = MODEL_DIR / "MFLOGP.sav"
print("MODEL     :", model_file)
print("Exists    :", model_file.exists())
print("Size      :", model_file.stat().st_size)
print("=" * 60)
#END DEBUG

MODEL = joblib.load(MODEL_DIR / "MFLOGP.sav")
SCALE_X = joblib.load(MODEL_DIR / "scale_X.sav")
SCALE_Y = joblib.load(MODEL_DIR / "scale_y.sav")


ELEMENTS = [
    "C",
    "H",
    "N",
    "O",
    "S",
    "P",
    "F",
    "Cl",
    "Br",
    "I",
]


# =============================================================================
# Helpers
# =============================================================================

def smiles_to_formula(smiles: str) -> str:
    """
    Convert a SMILES string into a molecular formula.
    """

    mol = Chem.MolFromSmiles(smiles)

    if mol is None:
        raise ValueError("Invalid SMILES string.")

    return rdMolDescriptors.CalcMolFormula(mol)


def formula_to_dataframe(formula: str) -> pd.DataFrame:
    """
    Convert a molecular formula into the feature dataframe expected
    by the MFLOGP model.
    """

    parsed = chemparse.parse_formula(formula)

    row = {}

    for element in ELEMENTS:
        row[element] = parsed.get(element, 0)

    return pd.DataFrame([row], columns=ELEMENTS)


# =============================================================================
# Prediction
# =============================================================================

def predict(
    *,
    smiles: str | None = None,
    formula: str | None = None,
) -> dict:
    """
    Predict LogP from either a SMILES string or molecular formula.

    Parameters
    ----------
    smiles:
        SMILES representation of a molecule.

    formula:
        Molecular formula.

    Returns
    -------
    dict
    """

    if smiles is None and formula is None:
        raise ValueError("Either smiles or formula must be provided.")

    if smiles is not None:
        formula = smiles_to_formula(smiles)

    features = formula_to_dataframe(formula)

    scaled = SCALE_X.transform(features)

    prediction = MODEL.predict(scaled)

    logp = SCALE_Y.inverse_transform(
        prediction.reshape(-1, 1)
    )[0][0]

    return {
        "formula": formula,
        "logP": round(float(logp), 4),
    }