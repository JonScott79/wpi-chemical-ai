"""
app.py

WPI Chemistry Prediction API

Provides REST endpoints for machine learning chemistry models.

Currently supports:

    POST /api/predict/logp
    POST /api/predict/enthalpy-fusion

Run locally:

    uvicorn app:app --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.ML.mflogp import predict
from models.EnthalpyOfFusion.predict import FusionPredictor


# =============================================================================
# FastAPI
# =============================================================================

app = FastAPI(
    title="WPI Chemistry API",
    description="Machine Learning Chemistry Prediction API",
    version="1.0.0"
)

# Load once when the API starts
fusion_predictor = FusionPredictor()

print("=" * 60)
print("Fusion Predictor Ready:", fusion_predictor.ready)
print("=" * 60)

# =============================================================================
# CORS
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Request Models
# =============================================================================

class LogPPredictRequest(BaseModel):
    smiles: str | None = None
    formula: str | None = None


class EnthalpyFusionRequest(BaseModel):
    smiles: str
    temperature: float = 298.15


# =============================================================================
# Routes
# =============================================================================

@app.get("/")
def root():

    return {

        "service": "WPI Chemistry API",
        "version": "1.0.0",
        "status": "online"

    }


@app.get("/api")
def api():

    return {

        "status": "online",

        "models": [

            "MFLOGP",
            "Fusion GNN"

        ]

    }


@app.get("/api/models")
def get_models():
    """
    Return available prediction models.
    """

    return [

        {
            "id": "mflogp",
            "name": "MFLOGP",
            "property": "LogP",
            "version": "1.0",
            "batch": True
        },

        {
            "id": "enthalpy-fusion",
            "name": "Fusion GNN",
            "property": "Enthalpy of Fusion",
            "version": "1.0",
            "batch": True
        }

    ]


# =============================================================================
# LogP Prediction
# =============================================================================

@app.post("/api/predict/logp")
def predict_logp(request: LogPPredictRequest):
    """
    Predict octanol-water partition coefficient.
    """

    if request.smiles is None and request.formula is None:

        raise HTTPException(
            status_code=400,
            detail="Provide either a SMILES string or molecular formula."
        )

    try:

        result = predict(

            smiles=request.smiles,
            formula=request.formula

        )

        return {

            "success": True,
            "prediction": result

        }

    except ValueError as ex:

        raise HTTPException(
            status_code=400,
            detail=str(ex)
        )

    except Exception as ex:

        raise HTTPException(
            status_code=500,
            detail=str(ex)
        )


# =============================================================================
# Enthalpy of Fusion Prediction
# =============================================================================

@app.post("/api/predict/enthalpy-fusion")
def predict_enthalpy_fusion(request: EnthalpyFusionRequest):
    """
    Predict Enthalpy of Fusion.
    """

    try:

        results = fusion_predictor.predict_batch(

            [request.smiles],
            [request.temperature]

        )

        print("Predict Batch Returned:", results)

        result = results[0]

        if result is None:

            raise HTTPException(

                status_code=400,
                detail="Unable to generate molecular features."

            )

        return {

            "success": True,

            "prediction": {

                "formula": request.smiles,
                "property": "Enthalpy of Fusion",
                "value": float(result["Predicted_Enthalpy"]),
                "units": "kJ/mol",
                "uncertainty": float(result["Uncertainty"])

            }

        }

    except HTTPException:

        raise

    except Exception as ex:

        raise HTTPException(
            status_code=500,
            detail=str(ex)
        )


# =============================================================================
# Health Check
# =============================================================================

@app.get("/health")
def health():

    return {

        "status": "healthy"

    }