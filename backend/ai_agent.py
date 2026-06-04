import json
import os
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = (os.getenv("MISTRAL_API_KEY") or "").strip()
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL") or "mistral-large-latest"

_PROMPT = """You are an expert invoice data extractor. Extract all key information from the invoice text below.
Return ONLY a valid JSON object - no markdown, no code fences, no explanation - with this exact schema:
{
  "vendor_name": "string or null",
  "invoice_number": "string or null",
  "total_amount": number or null,
  "date": "YYYY-MM-DD string or null",
  "due_date": "YYYY-MM-DD string or null",
  "confidence_score": number between 0.0 and 1.0,
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "total_price": number
    }
  ]
}

Invoice Text:
"""


def _normalize_content(content):
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                parts.append(part["text"])
        return "".join(parts).strip()
    if isinstance(content, dict) and isinstance(content.get("text"), str):
        return content["text"].strip()
    return ""


def extract_invoice_data(text: str) -> dict:
    if not MISTRAL_API_KEY:
        raise RuntimeError("MISTRAL_API_KEY is not configured.")

    from mistralai.client.sdk import Mistral

    client = Mistral(api_key=MISTRAL_API_KEY)
    response = client.chat.complete(
        model=MISTRAL_MODEL,
        messages=[{"role": "user", "content": _PROMPT + text}],
        temperature=0.1,
    )
    raw = _normalize_content(response.choices[0].message.content)
    if raw.startswith("```"):
        raw = raw.replace("```json", "", 1).strip()
        raw = raw.replace("```", "", 1).strip()
    if not raw:
        raise RuntimeError("AI extraction returned no content.")
    return json.loads(raw)
