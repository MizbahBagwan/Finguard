import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
df = pd.read_csv("../dataset/transactions_1000.csv")

# Encode categorical columns
le1 = LabelEncoder()
le2 = LabelEncoder()

df["transaction_type"] = le1.fit_transform(df["transaction_type"])
df["merchant_category"] = le2.fit_transform(df["merchant_category"])

# Features and target
X = df.drop(["transaction_id", "fraud"], axis=1)
y = df["fraud"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# Accuracy
accuracy = model.score(X_test, y_test)
print(f"Model Accuracy: {accuracy:.2%}")

# Save model
joblib.dump(model, "fraud_model.pkl")
joblib.dump(le1, "transaction_encoder.pkl")
joblib.dump(le2, "merchant_encoder.pkl")

print("Model saved successfully!")