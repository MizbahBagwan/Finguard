import joblib
import shap
import pandas as pd


MODEL_PATH = "backend/ml/fraud_model.pkl"


class FraudExplainer:

    def __init__(self, model_path=MODEL_PATH):
        self.model = joblib.load(model_path)

        self.preprocessor = self.model.named_steps["preprocessor"]
        self.classifier = self.model.named_steps["classifier"]

        self.explainer = shap.TreeExplainer(self.classifier)

        # Feature names after ColumnTransformer + OneHotEncoder
        self.feature_names = self.preprocessor.get_feature_names_out()

    def explain(self, transaction: dict):

        # Convert incoming transaction to DataFrame
        X = pd.DataFrame([transaction])

        # Same preprocessing used during training
        X_transformed = self.preprocessor.transform(X)

        # Prediction
        prediction = int(self.model.predict(X)[0])
        probabilities = self.model.predict_proba(X)[0]

        fraud_probability = float(probabilities[1])

        # SHAP values
        shap_values = self.explainer.shap_values(X_transformed)

        # RandomForest binary classification:
        # shape = (samples, features, classes)
        if len(shap_values.shape) == 3:
            fraud_shap = shap_values[0, :, 1]
        else:
            fraud_shap = shap_values[0]

        # Convert sparse matrix if necessary
        if hasattr(X_transformed, "toarray"):
            transformed_values = X_transformed.toarray()[0]
        else:
            transformed_values = X_transformed[0]

        explanations = []

        for feature, value, shap_value in zip(
            self.feature_names,
            transformed_values,
            fraud_shap
        ):

            # Ignore inactive one-hot features
            if value == 0:
                continue

            explanations.append({
                "feature": feature,
                "value": float(value),
                "shap_value": float(shap_value),
                "impact": (
                    "increases_fraud_risk"
                    if shap_value > 0
                    else "decreases_fraud_risk"
                )
            })

        # Strongest reasons first
        explanations.sort(
            key=lambda x: abs(x["shap_value"]),
            reverse=True
        )

        return {
            "prediction": (
                "Fraud"
                if prediction == 1
                else "Safe"
            ),
            "fraud_probability": fraud_probability,
            "explanations": explanations[:10]
        }


if __name__ == "__main__":

    explainer = FraudExplainer()

    sample_transaction = {
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
    }

    result = explainer.explain(sample_transaction)

    print("\n=== EXPLAINABLE AI RESULT ===")
    print("Prediction:", result["prediction"])
    print(
        "Fraud probability:",
        round(result["fraud_probability"] * 100, 2),
        "%"
    )

    print("\nTop reasons:")

    for item in result["explanations"]:
        print(
            f"{item['feature']}: "
            f"{item['impact']} "
            f"(SHAP={item['shap_value']:.4f})"
        )