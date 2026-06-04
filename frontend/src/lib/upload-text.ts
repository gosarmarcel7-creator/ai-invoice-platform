import { Mistral } from "@mistralai/mistralai";
import { sanitizeDatabaseText } from "@/lib/invoice-workflow";
import { extractOcrTextFromPdf } from "@/lib/extraction";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY?.trim();
const OCR_MODEL = "mistral-ocr-latest";

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

function isImageMimeType(mimeType: string) {
  return IMAGE_MIME_TYPES.has(mimeType.toLowerCase());
}

async function extractPdfText(buffer: Buffer, filename: string): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const data = await parser.getText();
    await parser.destroy();
    const text = sanitizeDatabaseText(data.text);
    if (text.trim()) {
      return text;
    }
  } catch {
    // Fall through to OCR when native PDF text extraction fails or is empty.
  }

  try {
    return sanitizeDatabaseText(await extractOcrTextFromPdf(buffer, filename));
  } catch (error) {
    console.error("PDF OCR failed:", error);
    return "";
  }
}

async function extractImageText(buffer: Buffer, mimeType: string): Promise<string> {
  if (!MISTRAL_API_KEY) {
    return "";
  }

  try {
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const response = await client.ocr.process({
      model: OCR_MODEL,
      document: {
        type: "image_url",
        imageUrl: { url: dataUrl },
      },
    });

    return sanitizeDatabaseText(response.pages.map((page) => page.markdown).join("\n\n"));
  } catch (error) {
    console.error("Image OCR failed:", error);
    return "";
  }
}

export async function extractUploadText(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  if (filename.toLowerCase().endsWith(".pdf")) {
    return extractPdfText(buffer, filename);
  }

  if (isImageMimeType(mimeType)) {
    return extractImageText(buffer, mimeType);
  }

  return sanitizeDatabaseText(buffer.toString("utf-8"));
}
