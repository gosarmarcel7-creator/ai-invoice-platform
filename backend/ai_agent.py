import os
import random
import json
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL") or "mistral-large-latest"

_VENDORS = [
    "Acme Corporation", "TechSolutions Ltd", "Global Supplies Inc",
    "CloudServices Pro", "DataVault Systems", "NexGen Analytics",
    "Pinnacle Consulting", "Alpine Software", "Meridian Partners",
    "Vertex Technologies", "Cascade Innovations", "Summit Digital",
]

_DESCRIPTIONS = [
    "Software License (Annual)", "Cloud Hosting — Enterprise Tier",
    "Professional Services", "Support & Maintenance",
    "Implementation Consulting", "API Integration Services",
    "Security Audit", "Data Migration", "Custom Development",
    "Training & Onboarding",
]


def _mock_data() -> dict:
    vendor = random.choice(_VENDORS)
    num_items = random.randint(1, 4)
    items = []
    total = 0.0
    for _ in range(num_items):
        qty = random.randint(1, 20)
        price = round(random.uniform(250, 4500), 2)
        line_total = round(qty * price, 2)
        items.append({
            "description": random.choice(_DESCRIPTIONS),
            "quantity": qty,
            "unit_price": price,
            "total_price": line_total,
        })
        total += line_total

    month = random.randint(1, 6)
    day = random.randint(1, 28)
    due_month = month + 1 if month < 12 else 1

    return {
        "vendor_name": vendor,
        "invoice_number": f"INV-{random.randint(10000, 99999)}",
        "total_amount": round(total, 2),
        "date": f"2026-{month:02d}-{day:02d}",
        "due_date": f"2026-{due_month:02d}-{day:02d}",
        "confidence_score": round(random.uniform(0.84, 0.99), 2),
        "line_items": items,
    }


_PROMPT = """You are an expert invoice data extractor. Extract all key information from the invoice text below.
Return ONLY a valid JSON object — no markdown, no code fences, no explanation — with this exact schema:
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


def extract_invoice_data(text: str) -> dict:
    if not MISTRAL_API_KEY:
        return _mock_data()

    try:
        from mistralai.client.sdk import Mistral
        client = Mistral(api_key=MISTRAL_API_KEY)
        response = client.chat.complete(
            model=MISTRAL_MODEL,
            messages=[{"role": "user", "content": _PROMPT + text}],
            temperature=0.1,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        return json.loads(raw)
    except Exception as e:
        print(f"Mistral extraction error: {e}")
        return _mock_data()
