import joblib
import pandas as pd
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = BASE_DIR / "ml" / "fraud_model.pkl"


MODEL = joblib.load(MODEL_PATH)


def predict_transaction(transaction: dict):

    try:

        df = pd.DataFrame([transaction])

        print("========== ML INPUT ==========")
        print(df.columns.tolist())
        print(df)
        print("==============================")


        # create missing ML features

        df["abs_amount"] = abs(df["amount"])


        df["large_transaction"] = (
            df["amount"] > 15000
        ).astype(int)


        df["merchant_category_frequency"] = 1


        df["risk_indicator"] = (
            df["location_risk"] +
            df["failed_attempts"] * 10
        )


        prediction = MODEL.predict(df)[0]


        probability = (
            MODEL.predict_proba(df)[0][1]
            * 100
        )


        risk_score = round(
            float(probability),
            2
        )


        return {

            "success": True,

            "prediction":
            "Fraud"
            if prediction == 1
            else "Safe",

            "fraud_probability":
            risk_score,

            "risk_score":
            risk_score

        }


    except Exception as e:


        return {

            "success":False,

            "message":str(e)

        }