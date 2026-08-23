import joblib
import shap
import pandas as pd

MODEL_PATH = "backend/ml/fraud_model.pkl"

# Load complete pipeline
model = joblib.load(MODEL_PATH)

# Separate preprocessor and Random Forest
preprocessor = model.named_steps["preprocessor"]
classifier = model.named_steps["classifier"]

# One sample transaction
sample = pd.DataFrame([{
    "amount": 25000,
    "hour": 23,
    "location_risk": 0.9,
    "device_trusted": 0,
    "failed_attempts": 3,
    "is_international": 1,
    "large_transaction": 1,
    "risk_indicator": 1,
    "abs_amount": 25000,
    "merchant_category_frequency": 0.05,
    "transaction_type": "Transfer",
    "merchant_category": "Electronics",
}])

# Apply the SAME preprocessing used during training
X_transformed = preprocessor.transform(sample)

# SHAP explainer for Random Forest
explainer = shap.TreeExplainer(classifier)

# Calculate SHAP values
shap_values = explainer.shap_values(X_transformed)

print("\n=== XAI TEST ===")

print("Prediction:", model.predict(sample)[0])

print("Fraud probability:", model.predict_proba(sample)[0][1])

print("\nSHAP calculation successful!")

print("Transformed feature count:", X_transformed.shape[1])

print("SHAP value shape:", getattr(shap_values, "shape", None))