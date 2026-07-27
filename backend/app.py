"""
app.py

WPI Chemistry Prediction API

Provides REST endpoints for machine learning chemistry models.
Currently supports:

    POST /api/predict/logp

Run locally:

    uvicorn app:app --reload

"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.ML.mflogp import predict


# =============================================================================
# FastAPI
# =============================================================================

app = FastAPI(
    title="WPI Chemistry API",
    description="Machine Learning Chemistry Prediction API",
    version="1.0.0"
)


# =============================================================================
# CORS
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Lock this down later for production
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
            "MFLOGP"
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
        }

    ]
    
    
@app.post("/api/predict/logp")
def predict_logp(request: LogPPredictRequest):
    """
    Predict octanol-water partition coefficient (LogP).

    Accepts either:

        {
            "smiles": "CCO"
        }

    or

        {
            "formula": "C2H6O"
        }
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
# Health Check
# =============================================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }