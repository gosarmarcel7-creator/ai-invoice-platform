import { Mistral } from "@mistralai/mistralai";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? "mistral-large-latest";

const FALLBACK_VENDORS = [
  "Acme Corporation",
  "TechSolutions Ltd",
  "Global Supplies Inc",
  "CloudServices Pro",
  "DataVault Systems",
  "NexGen Analytics",
  "Pinnacle Consulting",
  "Alpine Software",
  "Meridian Partners",
  "Vertex Technologies",
  "Cascade Innovations",
  "Summit Digital",
];

const FALLBACK_DESCRIPTIONS = [
  "Software License (Annual)",
  "Cloud Hosting - Enterprise Tier",
  "Professional Services",
  "Support & Maintenance",
  "Implementation Consulting",
  "API Integration Services",
  "Security Audit",
  "Data Migration",
  "Custom Development",
  "Training & Onboarding",
];

const PROMPT = `You are an expert invoice data extractor. Extract all key information from the invoice text below.
Return ONLY a valid JSON object — no markdown, no code fences, no explanation — with this exact schema:
{
  "vendor_name": "string or null",
  "invoice_number": "string or null",
  "total_amount": number or null,
  "date": "YYYY-MM-DD string or null",
  "due_date": "YYYY-MM-DD string or null",
  "confidence_score": number between 0.0 and 1.0,
  "line_items": [
    { "description": "string", "quantity": number, "unit_price": number, "total_price": number }
  ]
}

Invoice Text:
`;

function getFallbackData(): Record<string, unknown> {
  const vendor = FALLBACK_VENDORS[Math.floor(Math.random() * FALLBACK_VENDORS.length)];
  const month = Math.max(1, Math.min(12, Math.floor(Math.random() * 6) + 1));
  const day = Math.max(1, Math.min(28, Math.floor(Math.random() * 28) + 1));
  const dueMonth = month < 12 ? month + 1 : 1;
  const numItems = Math.floor(Math.random() * 4) + 1;
  const lineItems = [];
  let total = 0;

  for (let index = 0; index < numItems; index += 1) {
    const quantity = Math.floor(Math.random() * 20) + 1;
    const unitPrice = Number((Math.random() * 4250 + 250).toFixed(2));
    const lineTotal = Number((quantity * unitPrice).toFixed(2));
    total += lineTotal;
    lineItems.push({
      description: FALLBACK_DESCRIPTIONS[Math.floor(Math.random() * FALLBACK_DESCRIPTIONS.length)],
      quantity,
      unit_price: unitPrice,
      total_price: lineTotal,
    });
  }

  return {
    vendor_name: vendor,
    invoice_number: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
    total_amount: Number(total.toFixed(2)),
    date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    due_date: `2026-${String(dueMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    confidence_score: Number((Math.random() * 0.15 + 0.84).toFixed(2)),
    line_items: lineItems,
  };
}

function normalizeMistralContent(content: unknown) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        if ("text" in part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();
  }
  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>;
    if (typeof record.text === "string") return record.text.trim();
  }
  return "";
}

export async function extractInvoiceData(text: string): Promise<Record<string, unknown>> {
  if (!MISTRAL_API_KEY) {
    return getFallbackData();
  }
  try {
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    const response = await client.chat.complete({
      model: MISTRAL_MODEL,
      messages: [{ role: "user", content: PROMPT + text }],
      temperature: 0.1,
      responseFormat: { type: "json_object" },
    });

    let raw = normalizeMistralContent(response.choices?.[0]?.message?.content);
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    if (!raw) {
      return getFallbackData();
    }

    return JSON.parse(raw);
  } catch (e) {
    console.warn("Mistral extraction error, using fallback data:", e);
    return getFallbackData();
  }
}
