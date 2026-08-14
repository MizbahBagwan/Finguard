import os
import json
import re

from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def analyze_transaction(transaction):

    prompt = f"""
You are a financial fraud detection AI.

Analyze the following transaction carefully.

Transaction Details:
{json.dumps(transaction, indent=2)}

Return ONLY valid JSON.

Do NOT return markdown.
Do NOT use ```json.
Do NOT use ```.

The JSON MUST contain exactly these fields:

{{
    "risk_score": 0,
    "fraud_probability": 0,
    "prediction": "Safe",
    "risk_level": "Low",
    "reason": "",
    "recommendation": ""
}}

Rules:

1. risk_score must be an integer from 0 to 100.
2. fraud_probability must be an integer from 0 to 100.
3. prediction must be either "Safe" or "Fraud".
4. risk_level must be one of:
   "Low", "Medium", "High".
5. High risk should generally have risk_score >= 70.
6. Medium risk should generally have risk_score between 35 and 69.
7. Low risk should generally have risk_score below 35.
8. Consider amount, transaction time, device trust,
   failed attempts, location risk, international status,
   merchant, merchant category and transaction type.
9. The reason must explain the important risk factors.
10. The recommendation must give a clear action.

Return ONLY the JSON object.
"""

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        response_text = response.text.strip()

        print("========== GEMINI RAW RESPONSE ==========")
        print(response_text)

        # Remove markdown fences if Gemini adds them
        response_text = re.sub(
            r"^```json\s*",
            "",
            response_text,
            flags=re.IGNORECASE
        )

        response_text = re.sub(
            r"^```\s*",
            "",
            response_text
        )

        response_text = re.sub(
            r"\s*```$",
            "",
            response_text
        )

        response_text = response_text.strip()

        print("========== CLEAN GEMINI RESPONSE ==========")
        print(response_text)

        result = json.loads(response_text)

        print("========== PARSED AI RESULT ==========")
        print(result)

        # ------------------------------------
        # Validate required fields
        # ------------------------------------

        required_fields = [
            "risk_score",
            "fraud_probability",
            "prediction",
            "risk_level",
            "reason",
            "recommendation"
        ]

        for field in required_fields:

            if field not in result:

                raise ValueError(
                    f"Missing Gemini field: {field}"
                )

        # ------------------------------------
        # Normalize values
        # ------------------------------------

        result["risk_score"] = int(
            max(
                0,
                min(
                    100,
                    float(result["risk_score"])
                )
            )
        )

        result["fraud_probability"] = int(
            max(
                0,
                min(
                    100,
                    float(result["fraud_probability"])
                )
            )
        )

        result["prediction"] = str(
            result["prediction"]
        ).strip()

        result["risk_level"] = str(
            result["risk_level"]
        ).strip()

        result["reason"] = str(
            result["reason"]
        ).strip()

        result["recommendation"] = str(
            result["recommendation"]
        ).strip()

        # ------------------------------------
        # Normalize prediction
        # ------------------------------------

        if result["prediction"].lower() == "legitimate":

            result["prediction"] = "Safe"

        elif result["prediction"].lower() == "safe":

            result["prediction"] = "Safe"

        elif result["prediction"].lower() == "fraud":

            result["prediction"] = "Fraud"

        # ------------------------------------
        # Normalize risk level
        # ------------------------------------

        score = result["risk_score"]

        if score >= 70:

            result["risk_level"] = "High"

        elif score >= 35:

            result["risk_level"] = "Medium"

        else:

            result["risk_level"] = "Low"

        # ------------------------------------
        # Fraud status
        # ------------------------------------

        result["fraud_status"] = result["risk_level"]

        print("========== FINAL AI RESULT ==========")
        print(result)

        return result

    except Exception as e:

        print("❌ GEMINI ANALYSIS ERROR")
        print(type(e).__name__, ":", e)

        # IMPORTANT:
        # Do NOT silently pretend that a failed AI
        # analysis is a Safe transaction.

        return {
            "risk_score": 0,
            "fraud_probability": 0,
            "prediction": "Analysis Failed",
            "risk_level": "Unknown",
            "fraud_status": "Unknown",
            "reason": "Gemini analysis failed and no reliable AI result was available.",
            "recommendation": "Please run the AI analysis again."
        }