import { Mistral } from "@mistralai/mistralai";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY?.trim();
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? "mistral-large-latest";
const OCR_MODEL = "mistral-ocr-latest";

const PROMPT = `You are an expert invoice data extractor. Extract all key information from the invoice text below.
Return ONLY a valid JSON object - no markdown, no code fences, no explanation - with this exact schema:
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

function parseExtractionPayload(raw: string) {
  let payload = raw.trim();
  if (payload.startsWith("```")) {
    payload = payload.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  if (!payload) {
    throw new Error("AI extraction returned no content.");
  }
  return JSON.parse(payload) as Record<string, unknown>;
}

function requireMistralApiKey() {
  if (!MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not configured.");
  }
  return MISTRAL_API_KEY;
}

async function extractPdfOcrText(buffer: Buffer, filename: string): Promise<string> {
  const client = new Mistral({ apiKey: requireMistralApiKey() });
  const uploadedFile = await client.files.upload({
    file: {
      fileName: filename || "invoice.pdf",
      content: buffer,
    },
    purpose: "ocr",
  });

  const response = await client.ocr.process({
    model: OCR_MODEL,
    document: {
      type: "file",
      fileId: uploadedFile.id,
    },
  });

  return response.pages.map((page) => page.markdown).join("\n\n").trim();
}

export async function extractInvoiceData(text: string): Promise<Record<string, unknown>> {
  const client = new Mistral({ apiKey: requireMistralApiKey() });
  const response = await client.chat.complete({
    model: MISTRAL_MODEL,
    messages: [{ role: "user", content: PROMPT + text }],
    temperature: 0.1,
    responseFormat: { type: "json_object" },
  });

  const raw = normalizeMistralContent(response.choices?.[0]?.message?.content);
  return parseExtractionPayload(raw);
}

export async function extractOcrTextFromPdf(buffer: Buffer, filename: string): Promise<string> {
  try {
    return await extractPdfOcrText(buffer, filename);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF OCR failed.";
    throw new Error(message);
  }
}
