import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  extractOcrTextFromPdf: vi.fn(),
  getScreenshot: vi.fn(),
  getText: vi.fn(),
  ocrProcess: vi.fn(),
}));

vi.mock("./extraction", () => ({
  extractOcrTextFromPdf: mocks.extractOcrTextFromPdf,
}));

vi.mock("@mistralai/mistralai", () => ({
  Mistral: class {
    ocr = {
      process: mocks.ocrProcess,
    };
  },
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    getText = mocks.getText;
    getScreenshot = mocks.getScreenshot;
    destroy = mocks.destroy;
  },
}));

describe("extractUploadText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("MISTRAL_API_KEY", "test-key");

    mocks.destroy.mockResolvedValue(undefined);
    mocks.extractOcrTextFromPdf.mockResolvedValue("");
    mocks.getScreenshot.mockResolvedValue({
      total: 1,
      pages: [
        {
          dataUrl: "data:image/png;base64,abc",
          pageNumber: 1,
          width: 1000,
          height: 1400,
          scale: 1,
        },
      ],
    });
    mocks.ocrProcess.mockResolvedValue({
      pages: [{ markdown: "Vendor: Example Co.\nInvoice #: INV-1001\nTotal: €100.00" }],
    });
  });

  it("keeps readable native PDF text without falling back to OCR", async () => {
    mocks.getText.mockResolvedValue({
      text: [
        "Invoice #: INV-1001",
        "Vendor: Example Co.",
        "Date: 2026-06-04",
        "Total: €100.00",
      ].join("\n"),
    });

    const { extractUploadText } = await import("./upload-text");
    const text = await extractUploadText(
      Buffer.from("pdf"),
      "invoice.pdf",
      "application/pdf"
    );

    expect(text).toContain("Invoice #: INV-1001");
    expect(mocks.extractOcrTextFromPdf).not.toHaveBeenCalled();
    expect(mocks.ocrProcess).not.toHaveBeenCalled();
  });

  it("falls back to OCR when the native PDF text looks too weak", async () => {
    mocks.getText.mockResolvedValue({
      text: "SAMPLE",
    });

    const { extractUploadText } = await import("./upload-text");
    const text = await extractUploadText(
      Buffer.from("pdf"),
      "invoice.pdf",
      "application/pdf"
    );

    expect(text).toContain("Example Co.");
    expect(mocks.extractOcrTextFromPdf).toHaveBeenCalledTimes(1);
    expect(mocks.getScreenshot).toHaveBeenCalledTimes(1);
    expect(mocks.ocrProcess).toHaveBeenCalledTimes(1);
  });
});
