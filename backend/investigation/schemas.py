from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


CaseStatus = Literal[
    "NEW",
    "UNDER_INVESTIGATION",
    "CLOSED",
]
CaseDecision = Literal[
    "CONFIRMED_FRAUD",
    "LEGITIMATE",
    "INCONCLUSIVE",
]
CasePriority = Literal[
    "CRITICAL", 
    "HIGH", 
    "MODERATE", 
    "LOW",
]
Prediction = Literal["FRAUD", "LEGITIMATE"]

class CaseCreate(BaseModel):
    transaction_id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=5, max_length=200)
    account: str | None = Field(default=None, pattern=r"^\d{4}$")
    tx_count: int = Field(default=1, ge=1)
    amount: float | None = None
    time: float | None = None
    risk_score: float | None = Field(default=None, ge=0, le=1)
    prediction: Prediction | None = None
    status: CaseStatus = "NEW"
    priority: CasePriority = "MODERATE"
    analyst: str | None = Field(default=None, max_length=100)
    notes: str | None = None
    decision: CaseDecision | None = None
    conclusion: str | None = None

class CaseUpdate(BaseModel):
    status: CaseStatus | None = None
    priority: CasePriority | None = None
    analyst: str | None = Field(default=None, max_length=100)
    notes: str | None = None
    decision: CaseDecision | None = None
    conclusion: str | None = None
 
    # An explicit null would violate NOT NULL columns (500 error): refuse it (422).
    @field_validator("status", "priority")
    @classmethod
    def not_null(cls, value):
        if value is None:
            raise ValueError("This field cannot be null.")
        return value

class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    transaction_id: str
    title: str
    account: str | None
    tx_count: int
    amount: float | None
    time: float | None
    risk_score: float | None
    prediction: str | None
    status: str
    priority: str
    analyst: str | None
    notes: str | None
    decision: str | None
    conclusion: str | None
    created_at: datetime
    updated_at: datetime
