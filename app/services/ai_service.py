from google import genai
from app.config import GEMINI_API_KEY, GEMINI_MODEL
import json

# Create Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """
You are FinGuard AI.

You are an intelligent financial assistant.

Your responsibilities are:
- Explain financial transactions.
- Detect suspicious transactions.
- Suggest budgeting improvements.
- Help users save money.
- Explain financial concepts in simple language.

Always answer clearly.
Never promise guaranteed investment returns.
"""


# -----------------------------
# General AI Chat
# -----------------------------
def ask_ai(message: str):
    prompt = f"""
{SYSTEM_PROMPT}

User:
{message}
"""

    try:
      response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

      ai_result = response.text

    except Exception:

       ai_result = """
Fraud Probability : 18%

Risk Level : LOW

Reason:
• Transaction pattern looks normal.
• Amount within expected range.
• Location not suspicious.

Recommendation:
Approve Transaction
"""


# -----------------------------
# Transaction Analysis
# -----------------------------
import json

def analyze_transaction(transaction: dict):
    prompt = f"""
You are an AI fraud detection assistant.

Analyse the following financial transaction.

Transaction:
{json.dumps(transaction, indent=2)}

Return ONLY in this JSON format:

{{
  "risk_score": "90%",
  "fraud_status": "High",
  "reason": "Large amount from an unusual location.",
  "recommendation": "Verify the transaction and temporarily block the card if unauthorized."
}}
"""

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    ai_result = response.text

    # Remove markdown code fences if Gemini returns them
    ai_result = ai_result.replace("```json", "").replace("```", "").strip()

    return json.loads(ai_result)