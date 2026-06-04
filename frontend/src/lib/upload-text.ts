import { Mistral } from "@mistralai/mistralai";
import { sanitizeDatabaseText } from "@/lib/invoice-workflow";
import { extractOcrTextFromPdf } from "@/lib/extraction";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY?.trim();
const OCR_MODEL = "mistral-ocr-latest";
const PDF_SCREENSHOT_PAGE_LIMIT = 4;

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const INVOICE_KEYWORDS = [
  /invoice/i,
  /total/i,
  /subtotal/i,
  /amount/i,
  /date/i,
  /due/i,
  /vendor/i,
  /seller/i,
  /bill/i,
  /tax/i,
  /quantity/i,
];

function isImageMimeType(mimeType: string) {
  return IMAGE_MIME_TYPES.has(mimeType.toLowerCase());
}

type TextCandidate = {
  source: string;
  text: string;
  score: number;
};

function scoreExtractedText(text: string) {
  const normalized = sanitizeDatabaseText(text).replace(/\s+/g, " ").trim();
  if (!normalized) return 0;

  const length = normalized.length;
  const words = normalized.split(/\s+/).filter(Boolean).length;
  const letters = (normalized.match(/[A-Za-z]/g) ?? []).length;
  const digits = (normalized.match(/[0-9]/g) ?? []).length;
  const keywordHits = INVOICE_KEYWORDS.reduce(
    (count, pattern) => count + (pattern.test(normalized) ? 1 : 0),
    0
  );

  const lengthScore = Math.min(length / 240, 1);
  const wordScore = Math.min(words / 36, 1);
  const alphaScore = Math.min(letters / Math.max(length, 1) / 0.7, 1);
  const keywordScore = Math.min(keywordHits / 4, 1);
  const digitScore = Math.min(digits / 16, 1);

  return lengthScore * 0.28 + wordScore * 0.24 + alphaScore * 0.16 + keywordScore * 0.22 + digitScore * 0.1;
}

function isReadableText(text: string) {
  return scoreExtractedText(text) >= 0.42;
}

function pickBestCandidate(candidates: TextCandidate[]) {
  return candidates
    .slice()
    .sort((a, b) => b.score - a.score)
    .find((candidate) => candidate.text.trim())?.text.trim() ?? "";
}

async function extractPdfText(buffer: Buffer, filename: string): Promise<string> {
  const candidates: TextCandidate[] = [];

  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const data = await parser.getText();
      const text = sanitizeDatabaseText(data.text);
      candidates.push({ source: "pdf-text", text, score: scoreExtractedText(text) });
      if (isReadableText(text)) {
        return text;
      }
    } finally {
      await parser.destroy();
    }
  } catch {
    // Fall through to OCR when native PDF text extraction fails or is empty.
  }

  try {
    const ocrText = sanitizeDatabaseText(await extractOcrTextFromPdf(buffer, filename));
    candidates.push({ source: "pdf-ocr", text: ocrText, score: scoreExtractedText(ocrText) });
    if (isReadableText(ocrText)) {
      return ocrText;
    }
  } catch (error) {
    console.error("PDF OCR failed:", error);
  }

  try {
    const screenshotText = await extractPdfScreenshotOcrText(buffer, filename);
    candidates.push({
      source: "pdf-screenshot-ocr",
      text: screenshotText,
      score: scoreExtractedText(screenshotText),
    });
    if (isReadableText(screenshotText)) {
      return screenshotText;
    }
  } catch (error) {
    console.error("PDF screenshot OCR failed:", error);
  }

  return pickBestCandidate(candidates);
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

async function extractPdfScreenshotOcrText(buffer: Buffer, filename: string): Promise<string> {
  if (!MISTRAL_API_KEY) {
    return "";
  }

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const client = new Mistral({ apiKey: MISTRAL_API_KEY });

  try {
    const screenshots = await parser.getScreenshot({
      partial: Array.from({ length: PDF_SCREENSHOT_PAGE_LIMIT }, (_, index) => index + 1),
      desiredWidth: 1400,
      imageDataUrl: true,
      imageBuffer: false,
    });

    const pages: string[] = [];
    for (const page of screenshots.pages) {
      if (!page.dataUrl) continue;

      try {
        const response = await client.ocr.process({
          model: OCR_MODEL,
          document: {
            type: "image_url",
            imageUrl: { url: page.dataUrl },
          },
        });

        const pageText = sanitizeDatabaseText(
          response.pages.map((ocrPage) => ocrPage.markdown).join("\n\n").trim()
        );
        if (pageText) {
          pages.push(pageText);
        }
      } catch (error) {
        console.error(`Screenshot OCR failed for ${filename} page ${page.pageNumber}:`, error);
      }
    }

    return pages.join("\n\n").trim();
  } finally {
    await parser.destroy();
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
