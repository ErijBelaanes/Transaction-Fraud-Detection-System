"""GET /dashboard/summary: real dashboard figures, computed on the test set with the loaded model."""
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, status
from sklearn.metrics import average_precision_score, precision_score, recall_score
 
from .predictor import PROJECT_ROOT, PredictorError, get_predictor
 
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
 
DATA_DIR = PROJECT_ROOT / "data" / "processed"
 
# Same cut-offs as RISK_LEVELS in the frontend (src/config.js): keep them in sync.
CRITICAL_MIN = 0.95
HIGH_MIN = 0.60
 
BUCKET_HOURS = 6      # width of one bar in the "alert volume" chart
TOP_ALERTS = 10       # rows of the "priority alerts" table
 
_cache: dict = {}
 
 
def _scored():
    """Score the whole test set once (and again only if the model is reloaded)."""
    predictor = get_predictor()
    if _cache.get("predictor_id") != id(predictor):
        path = DATA_DIR / "X_test.parquet"
        if not path.is_file():
            raise FileNotFoundError(str(path))
        X = pd.read_parquet(path)[predictor.feature_columns]
        scores = predictor.model.predict_proba(X)[:, predictor._fraud_index]
 
        y = None
        y_path = DATA_DIR / "y_test.parquet"
        if y_path.is_file():
            y = pd.read_parquet(y_path).iloc[:, 0].reindex(X.index).to_numpy()
 
        _cache.update(predictor_id=id(predictor), X=X, scores=scores, y=y)
    return predictor, _cache["X"], _cache["scores"], _cache["y"]
 
 
@router.get("/summary")
def summary():
    try:
        predictor, X, scores, y = _scored()
    except PredictorError:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model not loaded.")
    except FileNotFoundError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="X_test.parquet not found. Run data_preprocessing.py first.",
        )
 
    threshold = predictor.threshold
    high_cut = max(HIGH_MIN, threshold)
 
    alerts = scores >= threshold
    critical = scores >= CRITICAL_MIN
    high = (scores >= high_cut) & ~critical
    moderate = alerts & (scores < high_cut)
 
    # Alerts per time slot (Time = seconds since the first transaction of the dataset)
    slot = (X["Time"].to_numpy() // (BUCKET_HOURS * 3600)).astype(int)
    volume = []
    for b in range(int(slot.max()) + 1):
        in_slot = slot == b
        start = (b * BUCKET_HOURS) % 24
        volume.append({
            "label": f"J{b * BUCKET_HOURS // 24 + 1} {start}-{start + BUCKET_HOURS} h",
            "critique": int((in_slot & critical).sum()),
            "eleve": int((in_slot & high).sum()),
            "modere": int((in_slot & moderate).sum()),
        })
 
    # Riskiest transactions, with their features so that the analysis page can open them
    top_alerts = []
    for i in np.argsort(-scores)[:TOP_ALERTS]:
        row = X.iloc[i]
        top_alerts.append({
            "transaction_id": f"txn_{X.index[i]}",
            "risk_score": float(scores[i]),
            **{name: float(row[name]) for name in X.columns},
        })
 
    # Real performance of the model on the test set (needs y_test.parquet)
    metrics = None
    if y is not None and not np.isnan(y).any():
        truth = y.astype(int)
        predicted = alerts.astype(int)
        metrics = {
            "frauds": int(truth.sum()),
            "detected": int(((predicted == 1) & (truth == 1)).sum()),
            "recall": float(recall_score(truth, predicted, zero_division=0)),
            "precision": float(precision_score(truth, predicted, zero_division=0)),
            "average_precision": float(average_precision_score(truth, scores)),
        }
 
    return {
        "threshold": threshold,
        "total_analyzed": int(len(scores)),
        "alerts_detected": int(alerts.sum()),
        "risk_distribution": {
            "critique": int(critical.sum()),
            "eleve": int(high.sum()),
            "modere": int(moderate.sum()),
        },
        "volume": volume,
        "top_alerts": top_alerts,
        "metrics": metrics,
        "source": "Jeu de test (data/processed/X_test.parquet)",
    }
 