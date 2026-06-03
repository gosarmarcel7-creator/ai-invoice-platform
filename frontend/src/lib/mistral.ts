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

export async function extractInvoiceData(text: string): Promise<Record<string, unknown>> {
  if (!MISTRAL_API_KEY) {
    throw new Error("Mistral is not configured.");
  }
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
    throw new Error("Invoice extraction failed.");
  }
}
