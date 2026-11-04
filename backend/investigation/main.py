import logging
import os
from collections.abc import Generator
from contextlib import asynccontextmanager
from typing import Annotated
 
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker
 
from fraud_detection.prediction_router import (
    router as prediction_router,
    verify_schema_matches_artifacts,
)
from fraud_detection.predictor import PredictorError, get_predictor, load_predictor
from fraud_detection.dashboard_router import router as dashboard_router
from fraud_detection.samples_router import router as samples_router
from investigation.database import engine
from investigation.models import InvestigationCase
from investigation.schemas import CaseCreate, CaseResponse, CaseUpdate
 
logger = logging.getLogger(__name__)
 
 
# Database sessions
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)
 
 
# Load the model once, when the server starts.
# If the model files are missing, the cases API still works and /predict answers 503.
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        predictor = load_predictor()
        verify_schema_matches_artifacts(predictor)
    except PredictorError as exc:
        logger.error("Model not loaded, /predict will answer 503: %s", exc)
    yield
 
 
# FastAPI application
app = FastAPI(
    title="Fraud Investigation API",
    description="API for fraud prediction and investigation cases.",
    version="1.1.0",
    lifespan=lifespan,
)
 
 
# Allowed frontend origins (override with CORS_ORIGINS in backend/.env)
DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Prediction routes: POST /predict and GET /transactions/samples
app.include_router(prediction_router)
app.include_router(samples_router)
app.include_router(dashboard_router)
 
 
# Database dependency
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 
 
DatabaseSession = Annotated[Session, Depends(get_db)]
 
 
# Health check
@app.get("/")
def root():
    return {
        "message": "Fraud Investigation API is running",
        "docs": "/docs",
    }
 
 
@app.get("/health")
def health():
    try:
        predictor = get_predictor()
        return {"status": "ok", "model_loaded": True, "threshold": predictor.threshold}
    except PredictorError:
        return {"status": "degraded", "model_loaded": False, "threshold": None}
 
 
# Create an investigation case
@app.post(
    "/cases",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_case(
    case_data: CaseCreate,
    db: DatabaseSession,
):
    data = case_data.model_dump()
 
    # Same rules as when updating a case
    if data["status"] == "CLOSED" and data["decision"] is None:
        raise HTTPException(
            status_code=400,
            detail="A final decision is required to close a case.",
        )
    if data["decision"] is not None and data["status"] != "CLOSED":
        data["status"] = "UNDER_INVESTIGATION"
 
    # One open case per transaction
    existing = db.scalar(
        select(InvestigationCase).where(
            InvestigationCase.transaction_id == case_data.transaction_id,
            InvestigationCase.status != "CLOSED",
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=f"An open case already exists for this transaction (id {existing.id}).",
        )
 
    case = InvestigationCase(**data)
 
    db.add(case)
    db.commit()
    db.refresh(case)
 
    return case
 
 
# List investigation cases, optionally filtered by status
@app.get("/cases", response_model=list[CaseResponse])
def list_cases(
    db: DatabaseSession,
    case_status: Annotated[
        str | None,
        Query(alias="status"),
    ] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
):
    query = select(InvestigationCase)
 
    if case_status is not None:
        allowed_statuses = {
            "NEW",
            "UNDER_INVESTIGATION",
            "CLOSED",
        }
 
        if case_status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid case status.",
            )
 
        query = query.where(
            InvestigationCase.status == case_status
        )
 
    query = (
        query
        .order_by(InvestigationCase.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
 
    return db.scalars(query).all()
 
 
# Retrieve one investigation case
@app.get("/cases/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: int,
    db: DatabaseSession,
):
    case = db.get(InvestigationCase, case_id)
 
    if case is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation case not found.",
        )
 
    return case
 
 
# Update an investigation case
@app.patch("/cases/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: int,
    case_data: CaseUpdate,
    db: DatabaseSession,
):
    case = db.get(InvestigationCase, case_id)
 
    if case is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation case not found.",
        )
 
    changes = case_data.model_dump(exclude_unset=True)
 
    # Closed cases cannot be modified
    if case.status == "CLOSED" and changes:
        raise HTTPException(
            status_code=400,
            detail="Closed cases cannot be modified.",
        )
 
    new_status = changes.get("status", case.status)
    new_decision = changes.get("decision", case.decision)
 
    # Require a final decision before closing a case
    if new_status == "CLOSED" and new_decision is None:
        raise HTTPException(
            status_code=400,
            detail="A final decision is required to close a case.",
        )
 
    # Recording a decision moves an open case into investigation
    if new_decision is not None and new_status != "CLOSED":
        changes["status"] = "UNDER_INVESTIGATION"
 
    for field, value in changes.items():
        setattr(case, field, value)
 
    db.commit()
    db.refresh(case)
 
    return case
 
 
# Delete an investigation case
@app.delete("/cases/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(
    case_id: int,
    db: DatabaseSession,
):
    case = db.get(InvestigationCase, case_id)
 
    if case is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation case not found.",
        )
 
    db.delete(case)
    db.commit()