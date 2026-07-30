import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_investigation_report(
    transaction,
    fraud_score,
    ocr_result,
    graph_summary
):

    prompt = f"""
You are a Financial Fraud Investigation Officer.

Analyze this transaction.

Transaction ID:
{transaction.get('transaction_id')}

Account:
{transaction.get('account_id')}

Amount:
₹{transaction.get('amount')}

Fraud Score:
{fraud_score}

OCR Result:
{ocr_result}

Graph Analysis:
{graph_summary}

Return ONLY JSON.

Format:

{{
 "risk_level":"High",
 "summary":"...",
 "reasons":[
 ],
 "recommendations":[
 ]
}}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )


    text = response.text.strip()


    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()


    return json.loads(text)