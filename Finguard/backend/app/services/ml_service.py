import joblib
import pandas as pd
from pathlib import Path

# -----------------------------
# Load ML files
# -----------------------------
BASE_DIR = Path(__file__).resolve().parents[2]

MODEL = joblib.load(BASE_DIR / "ml" / "fraud_model.pkl")
TRANSACTION_ENCODER = joblib.load(BASE_DIR / "ml" / "transaction_encoder.pkl")
MERCHANT_ENCODER = joblib.load(BASE_DIR / "ml" / "merchant_encoder.pkl")


def predict_transaction(transaction: dict):
    """
    Predict fraud probability for one transaction.
    """

    # -----------------------------
    # Create DataFrame
    # -----------------------------
    df = pd.DataFrame([transaction])

    # -----------------------------
    # Convert to string
    # -----------------------------
    df["transaction_type"] = df["transaction_type"].astype(str)
    df["merchant_category"] = df["merchant_category"].astype(str)

    # -----------------------------
    # Validate categories
    # -----------------------------
    if df.loc[0, "transaction_type"] not in TRANSACTION_ENCODER.classes_:
        return {
            "success": False,
            "message": f"Invalid transaction_type. Allowed values: {list(TRANSACTION_ENCODER.classes_)}"
        }

    if df.loc[0, "merchant_category"] not in MERCHANT_ENCODER.classes_:
        return {
            "success": False,
            "message": f"Invalid merchant_category. Allowed values: {list(MERCHANT_ENCODER.classes_)}"
        }

    # -----------------------------
    # Encode categorical columns
    # -----------------------------
    df["transaction_type"] = TRANSACTION_ENCODER.transform(
        df["transaction_type"]
    )

    df["merchant_category"] = MERCHANT_ENCODER.transform(
        df["merchant_category"]
    )

    # -----------------------------
    # Arrange columns exactly as training
    # -----------------------------
    X = df[
        [
            "amount",
            "transaction_type",
            "merchant_category",
            "hour",
            "location_risk",
            "device_trusted",
            "failed_attempts",
            "is_international",
        ]
    ]

    # -----------------------------
    # Prediction
    # -----------------------------
    prediction = MODEL.predict(X)[0]
    probability = MODEL.predict_proba(X)[0][1] * 100

    return {
        "success": True,
        "prediction": "Fraud" if prediction == 1 else "Safe",
        "fraud_probability": round(float(probability), 2)
    }