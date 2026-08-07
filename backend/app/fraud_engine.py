import os
import joblib
import numpy as np


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


MODEL_PATH = os.path.join(
    BASE_DIR,
    "fraud_model.pkl"
)


try:

    model = joblib.load(MODEL_PATH)

except Exception:

    model = None
import joblib
import numpy as np


# ================= LOAD ML MODEL =================

try:
    model = joblib.load("fraud_model.pkl")

except Exception:
    model = None



# ================= FRAUD PREDICTION =================

def predict_transaction(features):

    if model is None:

        return {
            "prediction": "Unknown",
            "fraud_probability": 0
        }


    data = np.array(features).reshape(1, -1)


    probability = model.predict_proba(data)[0][1]


    score = round(probability * 100, 2)


    prediction = "Fraud" if score >= 50 else "Safe"


    return {

        "prediction": prediction,

        "fraud_probability": score

    }



# ================= RISK LEVEL =================

def calculate_risk_level(score):

    if score >= 80:

        return "Critical Risk"


    elif score >= 50:

        return "Medium Risk"


    else:

        return "Low Risk"




# ================= AI SUMMARY =================

def generate_summary(prediction, score):


    if prediction == "Fraud":

        return (
            f"AI analysis detected suspicious activity. "
            f"Fraud probability is {score}%. "
            "Further investigation is recommended."
        )


    else:

        return (
            f"AI analysis found this transaction safe "
            f"with fraud probability {score}%."
        )




# ================= RISK INDICATORS =================

def generate_risk_indicators(prediction, score):


    indicators = []


    if score >= 50:

        indicators.append(
            "High fraud probability detected"
        )


    if score >= 80:

        indicators.append(
            "Critical risk threshold exceeded"
        )


    if len(indicators) == 0:

        indicators.append(
            "No major risk indicators found"
        )


    return indicators




# ================= RECOMMENDATIONS =================

def generate_recommendations(prediction):


    if prediction == "Fraud":

        return [

            "Block transaction temporarily",

            "Verify customer identity",

            "Review account activity",

            "Enable additional authentication"

        ]


    else:

        return [

            "Transaction approved",

            "Continue normal monitoring"

        ]




# ================= COMPLETE REPORT GENERATOR =================

def create_ai_report(features):


    result = predict_transaction(features)


    prediction = result["prediction"]

    score = result["fraud_probability"]


    report = {


        "prediction": prediction,


        "fraud_probability": score,


        "risk_level":
            calculate_risk_level(score),


        "summary":
            generate_summary(
                prediction,
                score
            ),


        "risk_indicators":
            generate_risk_indicators(
                prediction,
                score
            ),


        "recommendations":
            generate_recommendations(
                prediction
            )

    }


    return report