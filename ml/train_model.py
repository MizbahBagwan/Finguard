import pandas as pd
import joblib

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
)

# -----------------------------
# Load Dataset
# -----------------------------
df = pd.read_csv("uploads/finguard_transactions_500.csv")

# -----------------------------
# Create Synthetic Fraud Labels
# -----------------------------
# Transactions with amount <= -4000 are marked as fraud
df["is_fraud"] = (df["Amount"] <= -4000).astype(int)

print("Fraud Count:")
print(df["is_fraud"].value_counts())

# -----------------------------
# Convert Date
# -----------------------------
df["Date"] = pd.to_datetime(df["Date"], dayfirst=True)

df["Day"] = df["Date"].dt.day
df["Month"] = df["Date"].dt.month
df["Weekday"] = df["Date"].dt.weekday

df.drop("Date", axis=1, inplace=True)

# -----------------------------
# Encode Categorical Columns
# -----------------------------
encoder = LabelEncoder()

for col in ["Merchant", "Category", "Description"]:
    df[col] = encoder.fit_transform(df[col])

# -----------------------------
# Features & Target
# -----------------------------
X = df.drop("is_fraud", axis=1)
y = df["is_fraud"]

# -----------------------------
# Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

# -----------------------------
# Train Random Forest
# -----------------------------
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
)

model.fit(X_train, y_train)

# -----------------------------
# Predictions
# -----------------------------
pred = model.predict(X_test)

# -----------------------------
# Evaluation
# -----------------------------
print("\nModel Evaluation")
print("----------------------------")
print("Accuracy :", accuracy_score(y_test, pred))
print("Precision:", precision_score(y_test, pred))
print("Recall   :", recall_score(y_test, pred))
print("F1 Score :", f1_score(y_test, pred))

print("\nClassification Report")
print(classification_report(y_test, pred))

# -----------------------------
# Save Model
# -----------------------------
joblib.dump(model, "ml/fraud_model.pkl")

print("\nModel saved successfully as ml/fraud_model.pkl")