import os
import json

from dotenv import load_dotenv
from google import genai

load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)



def analyze_transaction(transaction):

    prompt = f"""
You are a financial fraud detection AI.

Analyze this transaction:

Transaction Details:
{json.dumps(transaction, indent=2)}

Return ONLY JSON:

{{
    "reason": "",
    "risk_explanation": "",
    "recommendation": ""
}}

"""


    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )


    return json.loads(response.text)