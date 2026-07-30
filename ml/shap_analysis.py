import pandas as pd
import joblib
import shap
import matplotlib.pyplot as plt
from sklearn.preprocessing import LabelEncoder

# -----------------------------
# Load dataset
# -----------------------------
df = pd.read_csv("uploads/finguard_transactions_500.csv")

# Create synthetic fraud labels
df["is_fraud"] = (df["Amount"] <= -4000).astype(int)

# Convert Date
df["Date"] = pd.to_datetime(df["Date"], dayfirst=True)
df["Day"] = df["Date"].dt.day
df["Month"] = df["Date"].dt.month
df["Weekday"] = df["Date"].dt.weekday
df.drop("Date", axis=1, inplace=True)

# Encode categorical columns
encoder = LabelEncoder()
for col in ["Merchant", "Category", "Description"]:
    df[col] = encoder.fit_transform(df[col])

# Features
X = df.drop("is_fraud", axis=1)

# Load model
model = joblib.load("ml/fraud_model.pkl")

# SHAP Explainer
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# Summary Plot
shap.summary_plot(shap_values, X, show=False)
plt.savefig("ml/shap_summary.png", dpi=300, bbox_inches="tight")
plt.close()

# Bar Plot
shap.summary_plot(shap_values, X, plot_type="bar", show=False)
plt.savefig("ml/shap_feature_importance.png", dpi=300, bbox_inches="tight")
plt.close()

print("SHAP graphs generated successfully!")