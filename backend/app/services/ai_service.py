import os
import json
import re

import google.generativeai as genai
from dotenv import load_dotenv

from app.config import GEMINI_MODEL


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured in .env")


# ============================================================
# GEMINI CONFIGURATION
# ============================================================

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel(GEMINI_MODEL)


# ============================================================
# HELPER: CLEAN GEMINI JSON RESPONSE
# ============================================================

def clean_json_response(text: str) -> str:
    """
    Gemini may return JSON inside Markdown code fences:

    ```json
    {
        ...
    }
    ```

    This function removes the code fences before json.loads().
    """

    if not text:
        raise ValueError("Gemini returned an empty response.")

    text = text.strip()

    # Remove ```json / ```JSON / ``` etc. from beginning
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    # Remove closing ``` from the end
    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    return text


# ============================================================
# MAIN AI ANALYSIS
# ============================================================

def analyze_transaction(data):

    prompt = f"""
You are an expert AI Financial Fraud Detection System.

Analyze the following financial transaction and determine
whether it is fraudulent.

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

Do NOT use Markdown.
Do NOT wrap the JSON in ```json or ```.

Use exactly this structure:

{{
    "risk_score": 90,
    "fraud_probability": 90,
    "prediction": "Fraud",
    "risk_level": "High",
    "reason": "Explain the main reasons why this transaction is risky.",
    "recommendation": "Recommended security action."
}}

The "reason" should mention the important risk factors
from the transaction rather than giving a generic statement.

The "recommendation" should provide a practical fraud-prevention
action for the investigator.
"""

    # ========================================================
    # GEMINI API CALL
    # ========================================================

    try:

        response = model.generate_content(prompt)

        print("========== GEMINI RESPONSE ==========")
        print(response.text)

        # ----------------------------------------------------
        # CLEAN RESPONSE BEFORE JSON PARSING
        # ----------------------------------------------------

        cleaned_response = clean_json_response(
            response.text
        )

        print("========== CLEANED GEMINI JSON ==========")
        print(cleaned_response)

        # ----------------------------------------------------
        # PARSE JSON
        # ----------------------------------------------------

        ai_result = json.loads(
            cleaned_response
        )

        # ----------------------------------------------------
        # ENSURE REQUIRED FIELDS EXIST
        # ----------------------------------------------------

        ai_result.setdefault(
            "risk_score",
            0
        )

        ai_result.setdefault(
            "fraud_probability",
            ai_result.get("risk_score", 0)
        )

        ai_result.setdefault(
            "prediction",
            "Unknown"
        )

        ai_result.setdefault(
            "risk_level",
            "Unknown"
        )

        ai_result.setdefault(
            "reason",
            "No detailed explanation was provided."
        )

        ai_result.setdefault(
            "recommendation",
            "Review the transaction manually."
        )

        # ----------------------------------------------------
        # FRAUD STATUS
        # ----------------------------------------------------

        risk_level = str(
            ai_result.get("risk_level", "")
        )

        if risk_level.lower() == "high":
            ai_result["fraud_status"] = "High Risk"

        elif risk_level.lower() == "medium":
            ai_result["fraud_status"] = "Medium Risk"

        elif risk_level.lower() == "low":
            ai_result["fraud_status"] = "Safe"

        else:
            ai_result["fraud_status"] = risk_level

        # ----------------------------------------------------
        # FINAL RESULT
        # ----------------------------------------------------

        print("========== AI RESULT ==========")
        print(ai_result)

        return ai_result

    # ========================================================
    # FALLBACK LOGIC
    # ========================================================

    except Exception as e:

        print("Gemini API Error:", e)

        amount = data.get("amount", 0)

        try:
            amount = float(amount)
        except (TypeError, ValueError):
            amount = 0

        # ----------------------------------------------------
        # HIGH RISK
        # ----------------------------------------------------

        if amount > 40000:

            return {
                "risk_score": 90,
                "fraud_probability": 90,
                "prediction": "Fraud",
                "risk_level": "High",
                "fraud_status": "High Risk",
                "reason": (
                    "Large transaction amount detected. "
                    "The transaction should be reviewed for "
                    "additional risk indicators."
                ),
                "recommendation": (
                    "Block the transaction temporarily and "
                    "verify the customer using MFA or direct verification."
                )
            }

        # ----------------------------------------------------
        # MEDIUM RISK
        # ----------------------------------------------------

        elif amount > 15000:

            return {
                "risk_score": 60,
                "fraud_probability": 60,
                "prediction": "Suspicious",
                "risk_level": "Medium",
                "fraud_status": "Medium Risk",
                "reason": (
                    "The transaction amount is above the "
                    "normal monitoring threshold."
                ),
                "recommendation": (
                    "Verify the customer before processing "
                    "the transaction."
                )
            }

        # ----------------------------------------------------
        # LOW RISK
        # ----------------------------------------------------

        else:

            return {
                "risk_score": 20,
                "fraud_probability": 20,
                "prediction": "Safe",
                "risk_level": "Low",
                "fraud_status": "Safe",
                "reason": (
                    "The transaction does not show significant "
                    "risk based on the available transaction data."
                ),
                "recommendation": (
                    "Allow the transaction while continuing "
                    "normal monitoring."
                )
            }