"""GET /transactions/samples: real rows of the test set, ready to be sent to POST /predict."""
import random
from functools import lru_cache
 
import pandas as pd
from fastapi import APIRouter, HTTPException, Query, status
 
from .predictor import PROJECT_ROOT, get_predictor
 
router = APIRouter(prefix="/transactions", tags=["Demo transactions"])
 
DATA_DIR = PROJECT_ROOT / "data" / "processed"
 
 
@lru_cache(maxsize=1)
def _load_samples() -> pd.DataFrame:
    path = DATA_DIR / "X_test.parquet"
    if not path.is_file():
        raise FileNotFoundError(str(path))
    return pd.read_parquet(path)
 
 
@lru_cache(maxsize=1)
def _load_labels():
    """Real class of each test transaction (1 = fraud), or None if the file is missing."""
    path = DATA_DIR / "y_test.parquet"
    if not path.is_file():
        return None
    return pd.read_parquet(path).iloc[:, 0]
 
 
@router.get("/samples")
def samples(
    limit: int = Query(default=20, ge=1, le=100),
    frauds: int = Query(default=5, ge=0, le=50, description="How many real frauds to include."),
    seed: int | None = Query(default=None, description="Fix it to get the same rows on every call."), 
):
    """Return `limit` test transactions, `frauds` of them being real frauds.
 
    Frauds are ~0.2 % of the data: a purely random sample would contain almost none,
    and the demo would never show a suspicious transaction.
    The same rows are returned on every call (stable demo).
    """
    try:
        frame = _load_samples()
    except FileNotFoundError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="X_test.parquet not found. Run data_preprocessing.py first.",
        )
 
    columns = get_predictor().feature_columns  # same names and order as in training
    labels = _load_labels()
 
    if labels is not None:
        labels = labels.reindex(frame.index)
        fraud_ids = labels.index[labels == 1]
        legit_ids = labels.index[labels == 0]
        n_fraud = min(frauds, limit, len(fraud_ids))
        n_legit = min(limit - n_fraud, len(legit_ids))
        picked = (
            fraud_ids.to_series().sample(n=n_fraud, random_state=seed).tolist()
            + legit_ids.to_series().sample(n=n_legit, random_state=seed).tolist()
        )
        random.Random(seed).shuffle(picked)  # frauds are not all at the top of the list
    else:
        picked = frame.sample(n=min(limit, len(frame)), random_state=seed).index.tolist()
 
    rows = frame.loc[picked, columns]
    result = []
    for index, row in rows.iterrows():
        item = {
            "transaction_id": f"txn_{index}",
            **{name: float(value) for name, value in row.items()},
        }
        if labels is not None:
            # Information for the demo only: it must NOT be sent back to POST /predict
            item["actual_class"] = int(labels.loc[index])
        result.append(item)
    return result
