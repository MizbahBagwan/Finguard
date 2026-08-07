import joblib
import pandas as pd

# Load trained model
model = joblib.load("ml/fraud_model.pkl")

# Sample transaction
sample = {
    "Merchant": 5,
    "Category": 2,
    "Description": 10,
    "Amount": -4500,
    "Day": 15,
    "Month": 7,
    "Weekday": 2
}

# Convert to DataFrame
df = pd.DataFrame([sample])

# Prediction
prediction = model.predict(df)[0]

# Probability
probability = model.predict_proba(df)[0][1]

risk_score = round(probability * 100, 2)

print("Prediction:", "Fraud" if prediction == 1 else "Legitimate")
print("Risk Score:", risk_score)