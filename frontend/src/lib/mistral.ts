import { Mistral } from "@mistralai/mistralai";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? "mistral-large-latest";

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

function mockData() {
  const vendors = ["Acme Corp", "TechSolutions Ltd", "Global Supplies Inc", "CloudServices Pro"];
  const descs = ["Software License", "Cloud Hosting", "Professional Services", "Support & Maintenance"];
  const vendor = vendors[Math.floor(Math.random() * vendors.length)];
  const items = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => {
    const qty = Math.floor(Math.random() * 10) + 1;
    const price = Math.round(Math.random() * 2000 + 200);
    return { description: descs[Math.floor(Math.random() * descs.length)], quantity: qty, unit_price: price, total_price: qty * price };
  });
  const total = items.reduce((s, i) => s + i.total_price, 0);
  return { vendor_name: vendor, invoice_number: `INV-${Math.floor(Math.random() * 90000) + 10000}`, total_amount: total, date: new Date().toISOString().slice(0, 10), due_date: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), confidence_score: 0.85 + Math.random() * 0.14, line_items: items };
}

export async function extractInvoiceData(text: string): Promise<Record<string, unknown>> {
  if (!MISTRAL_API_KEY) return mockData();
  try {
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    const response = await client.chat.complete({
      model: MISTRAL_MODEL,
      messages: [{ role: "user", content: PROMPT + text }],
      temperature: 0.1,
    });
    let raw = (response.choices?.[0]?.message?.content as string ?? "").trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Mistral extraction error:", e);
    return mockData();
  }
}
