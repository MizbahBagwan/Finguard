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

    if not text:
        raise ValueError("Gemini returned an empty response.")

    text = text.strip()

    # Remove ```json
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    # Remove closing ```
    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    return text.strip()


# ============================================================
# MAIN AI ANALYSIS
# ============================================================

def analyze_transaction(data):

    # --------------------------------------------------------
    # ML RESULT
    # --------------------------------------------------------

    ml_prediction = data.get(
        "prediction",
        "Unknown"
    )

    ml_risk_score = data.get(
        "risk_score",
        0
    )

    ml_fraud_probability = data.get(
        "fraud_probability",
        ml_risk_score
    )

    # --------------------------------------------------------
    # GEMINI PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are FinGuard AI, a financial fraud investigation assistant.

Your job is ONLY to explain the transaction and provide
a practical security recommendation.

The Machine Learning model is the FINAL authority for:

- Prediction
- Risk Score
- Fraud Probability
- Risk Level

DO NOT change or recalculate the ML result.

ML Prediction:
{ml_prediction}

IMPORTANT:
The ML Prediction above is authoritative.

If ML Prediction is "Fraud":
- reason MUST describe the transaction as fraudulent/high risk.
- recommendation MUST NOT say "Allow the transaction".
- recommendation MUST recommend blocking, holding, or verifying the transaction.

If ML Prediction is "Safe":
- reason may describe the transaction as safe.
- recommendation may allow normal monitoring.{ml_prediction}

ML Risk Score:
{ml_risk_score}%

ML Fraud Probability:
{ml_fraud_probability}%


TRANSACTION DETAILS

Transaction ID:
{data.get("transaction_id", "")}

Account ID:
{data.get("account_id", "")}

Amount:
₹{data.get("amount", 0)}

Merchant:
{data.get("merchant", "")}

Location:
{data.get("location", "")}

Time:
{data.get("time", "")}

Card Type:
{data.get("card_type", "")}

Transaction Type:
{data.get("transaction_type", "")}

Merchant Category:
{data.get("merchant_category", "")}

Hour:
{data.get("hour", "")}

Location Risk:
{data.get("location_risk", 0)}

Device Trusted:
{data.get("device_trusted", False)}

Failed Attempts:
{data.get("failed_attempts", 0)}

International Transaction:
{data.get("is_international", False)}


IMPORTANT RULES

1. Do NOT change the ML prediction.

2. Do NOT change the ML risk score.

3. Do NOT change the ML fraud probability.

4. Do NOT invent any transaction information.

5. Use the actual values provided above.

6. Mention specific risk factors when they exist.

7. If failed attempts are 0, do NOT say there were
   multiple failed attempts.

8. If the device is trusted, do NOT call it untrusted.

9. If the transaction is not international, do NOT
   call it international.

10. Use the actual Location Risk value.

11. Do NOT call Location Risk 10 or 0 maximum/high risk.

12. Do NOT say a merchant category is automatically fraudulent.

13. For a Safe transaction, explain that the available
    indicators do not show significant risk.

14. For a Fraud transaction, mention the strongest
    available risk indicators.

15. Keep the explanation short and professional.

16. Give a practical security recommendation.

17. Return ONLY reason and recommendation.


RETURN ONLY VALID JSON:

{{
    "reason": "Short explanation using the actual transaction data.",
    "recommendation": "Practical security recommendation."
}}

Do NOT return:

- risk_score
- fraud_probability
- prediction
- risk_level
"""


    # ========================================================
    # GEMINI API CALL
    # ========================================================

    try:

        response = model.generate_content(prompt)

        print("========== GEMINI RESPONSE ==========")
        print(response.text)

        # ----------------------------------------------------
        # CLEAN RESPONSE
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
        # GET EXPLANATION
        # ----------------------------------------------------

        reason = ai_result.get(
            "reason",
            "No detailed explanation was provided."
        )

        recommendation = ai_result.get(
            "recommendation",
            "Review the transaction manually."
        )

        # ----------------------------------------------------
        # FINAL GEMINI RESULT
        # ----------------------------------------------------

        result = {
            "reason": str(reason),
            "recommendation": str(recommendation)
        }

        print("========== AI EXPLANATION ==========")
        print(result)

        return result


    # ========================================================
    # FALLBACK LOGIC
    # ========================================================

    except Exception as e:

        print("Gemini API Error:", e)

        # ----------------------------------------------------
        # TRANSACTION VALUES
        # ----------------------------------------------------

        amount = data.get(
            "amount",
            0
        )

        location_risk = data.get(
            "location_risk",
            0
        )

        device_trusted = data.get(
            "device_trusted",
            False
        )

        failed_attempts = data.get(
            "failed_attempts",
            0
        )

        is_international = data.get(
            "is_international",
            False
        )

        ml_prediction = str(
            data.get(
                "prediction",
                "Unknown"
            )
        )


        # ----------------------------------------------------
        # CONVERT NUMBERS
        # ----------------------------------------------------

        try:

            amount = float(amount)

        except (TypeError, ValueError):

            amount = 0


        try:

            location_risk = float(
                location_risk
            )

        except (TypeError, ValueError):

            location_risk = 0


        # ----------------------------------------------------
        # BUILD RISK FACTORS
        # ----------------------------------------------------

        risk_factors = []


        if amount >= 40000:

            risk_factors.append(
                f"large transaction amount of ₹{amount:,.0f}"
            )


        if not device_trusted:

            risk_factors.append(
                "untrusted device"
            )


        if failed_attempts > 0:

            risk_factors.append(
                f"{failed_attempts} failed attempt(s)"
            )


        if is_international:

            risk_factors.append(
                "international transaction"
            )


        if location_risk >= 70:

            risk_factors.append(
                f"high location risk score of {location_risk:g}"
            )


        # ----------------------------------------------------
        # FRAUD
        # ----------------------------------------------------

        if ml_prediction.lower() == "fraud":

            if risk_factors:

                reason = (
                    "The ML model classified this transaction "
                    "as fraud. Important risk indicators include "
                    + ", ".join(risk_factors)
                    + "."
                )

            else:

                reason = (
                    "The ML model classified this transaction "
                    "as fraud. The transaction should be reviewed "
                    "for additional risk indicators."
                )


            recommendation = (
                "Block the transaction temporarily and verify "
                "the customer using MFA or direct verification."
            )


        # ----------------------------------------------------
        # SUSPICIOUS / MEDIUM
        # ----------------------------------------------------

        elif ml_prediction.lower() in [
            "suspicious",
            "medium"
        ]:

            if risk_factors:

                reason = (
                    "The transaction requires additional review. "
                    "Available risk indicators include "
                    + ", ".join(risk_factors)
                    + "."
                )

            else:

                reason = (
                    "The transaction requires additional "
                    "monitoring based on the ML model result."
                )


            recommendation = (
                "Verify the customer before processing the "
                "transaction and continue monitoring."
            )


        # ----------------------------------------------------
        # SAFE
        # ----------------------------------------------------

        else:

            reason = (
                "The ML model classified this transaction "
                "as safe. The available transaction data "
                "does not show significant risk."
            )


            recommendation = (
                "Allow the transaction while continuing "
                "normal monitoring."
            )


        # ----------------------------------------------------
        # FINAL FALLBACK RESULT
        # ----------------------------------------------------

        return {
            "reason": reason,
            "recommendation": recommendation
        }