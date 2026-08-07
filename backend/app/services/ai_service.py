import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

from app.config import GEMINI_MODEL


load_dotenv()


API_KEY = os.getenv("GEMINI_API_KEY")


print("GEMINI KEY:", API_KEY)


genai.configure(
    api_key=API_KEY
)
print("========== AVAILABLE MODELS ==========")

for m in genai.list_models():
    if "generateContent" in m.supported_generation_methods:
        print(m.name)

print("CURRENT MODEL USED:", GEMINI_MODEL)

model = genai.GenerativeModel(
    GEMINI_MODEL
)



def analyze_transaction(data):

    prompt = f"""
You are an expert AI Financial Fraud Detection System.

Analyze the following transaction and determine whether it is fraudulent.

Transaction Details:

Transaction ID: {data.get("transaction_id", "")}
Account ID: {data.get("account_id", "")}
Amount: {data.get("amount", "")}
Merchant: {data.get("merchant", "")}
Location: {data.get("location", "")}
Time: {data.get("time", "")}
Card Type: {data.get("card_type", "")}
Transaction Type: {data.get("transaction_type", "")}
Merchant Category: {data.get("merchant_category", "")}
Hour: {data.get("hour", "")}
Location Risk: {data.get("location_risk", "")}
Device Trusted: {data.get("device_trusted", "")}
Failed Attempts: {data.get("failed_attempts", "")}
International Transaction: {data.get("is_international", "")}

Return ONLY valid JSON.

Example:

{{
    "risk_score": 90,
    "fraud_probability": 90,
    "prediction": "Fraud",
    "risk_level": "High",
    "reason": "Explain why this transaction is risky.",
    "recommendation": "Recommended action."
}}
"""


    # Gemini AI Call (Step 3)

    try:

        response = model.generate_content(
            prompt
        )

        print("========== GEMINI RESPONSE ==========")
        print(response.text)


        ai_result = json.loads(
            response.text
        )


        ai_result["fraud_status"] = ai_result.get(
            "risk_level",
            ""
        )


        return ai_result


    except Exception as e:

        print("Gemini API Error:", e)



    # Old logic (backup)

    amount = data.get("amount", 0)


    if amount > 40000:

        return {
            "risk_score": 90,
            "fraud_probability": 90,
            "prediction": "Fraud",
            "risk_level": "High",
            "fraud_status": "High Risk",
            "reason": "Large transaction amount detected.",
            "recommendation": "Block transaction and verify customer."
        }


    elif amount > 15000:

        return {
            "risk_score": 60,
            "fraud_probability": 60,
            "prediction": "Suspicious",
            "risk_level": "Medium",
            "fraud_status": "Medium Risk",
            "reason": "Medium value transaction.",
            "recommendation": "Verify customer before processing."
        }


    else:

        return {
            "risk_score": 20,
            "fraud_probability": 20,
            "prediction": "Safe",
            "risk_level": "Low",
            "fraud_status": "Safe",
            "reason": "Transaction pattern looks normal.",
            "recommendation": "Allow transaction."
        }