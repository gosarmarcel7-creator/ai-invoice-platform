import {
  MAX_UPLOAD_SIZE_BYTES,
  buildCsvRows,
  canRetryInvoice,
  computeAttentionReasons,
  sanitizeDatabaseText,
  validateExtractionResult,
  validateUpload,
} from "@/lib/invoice-workflow";

describe("validateUpload", () => {
  it("rejects unsupported file types", () => {
    const result = validateUpload({
      name: "payload.exe",
      type: "application/octet-stream",
      size: 1024,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unsupported file type");
  });

  it("rejects oversized files", () => {
    const result = validateUpload({
      name: "invoice.pdf",
      type: "application/pdf",
      size: MAX_UPLOAD_SIZE_BYTES + 1,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("File exceeds");
  });

  it("accepts supported image uploads within limits", () => {
    const result = validateUpload({
      name: "invoice.jpg",
      type: "image/jpeg",
      size: 2048,
    });

    expect(result).toEqual({
      ok: true,
      normalizedMimeType: "image/jpeg",
      normalizedExtension: "jpg",
    });
  });

  it("infers the correct mime type when the browser omits or genericizes it", () => {
    expect(
      validateUpload({
        name: "invoice.pdf",
        type: "application/octet-stream",
        size: 2048,
      })
    ).toEqual({
      ok: true,
      normalizedMimeType: "application/pdf",
      normalizedExtension: "pdf",
    });

    expect(
      validateUpload({
        name: "invoice.png",
        type: "",
        size: 2048,
      })
    ).toEqual({
      ok: true,
      normalizedMimeType: "image/png",
      normalizedExtension: "png",
    });
  });
});

describe("validateExtractionResult", () => {
  it("strips null bytes from extracted text fields", () => {
    const result = validateExtractionResult({
      vendor_name: "Acme\u0000 Corp",
      invoice_number: "INV-1001\u0000",
      total_amount: 120,
      date: "2026-06-01",
      due_date: "2026-06-30",
      confidence_score: 0.91,
      line_items: [
        {
          description: "Consulting\u0000 Services",
          quantity: 1,
          unit_price: 120,
          total_price: 120,
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.vendor_name).toBe("Acme Corp");
    expect(result.data.invoice_number).toBe("INV-1001");
    expect(result.data.line_items[0].description).toBe("Consulting Services");
  });

  it("returns review with attention flags for low confidence and inconsistent totals", () => {
    const result = validateExtractionResult({
      vendor_name: "Acme Corp",
      invoice_number: "INV-1001",
      total_amount: 500,
      date: "2026-06-01",
      due_date: "2026-06-30",
      confidence_score: 0.61,
      line_items: [
        {
          description: "Consulting",
          quantity: 2,
          unit_price: 100,
          total_price: 200,
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe("review");
    expect(result.needsAttention).toBe(true);
    expect(result.attentionReasons).toEqual(
      expect.arrayContaining(["low_confidence", "total_mismatch"])
    );
  });

  it("fails unusable extraction results instead of fabricating data", () => {
    const result = validateExtractionResult({
      vendor_name: null,
      invoice_number: null,
      total_amount: null,
      date: "06/01/2026",
      due_date: null,
      confidence_score: 0.8,
      line_items: [],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("date");
  });
});

describe("sanitizeDatabaseText", () => {
  it("removes null bytes from database-bound text", () => {
    expect(sanitizeDatabaseText("invoice\u0000 text")).toBe("invoice text");
  });
});

describe("computeAttentionReasons", () => {
  it("flags missing commercial fields even when the shape is valid", () => {
    const reasons = computeAttentionReasons({
      vendor_name: null,
      invoice_number: "INV-9",
      total_amount: 200,
      date: "2026-06-01",
      due_date: null,
      confidence_score: 0.92,
      line_items: [],
    });

    expect(reasons).toContain("missing_vendor");
  });
});

describe("canRetryInvoice", () => {
  it("only allows failed invoices to retry", () => {
    expect(canRetryInvoice("failed")).toBe(true);
    expect(canRetryInvoice("processing")).toBe(false);
    expect(canRetryInvoice("review")).toBe(false);
  });
});

describe("buildCsvRows", () => {
  it("flattens line items into export rows", () => {
    const rows = buildCsvRows([
      {
        id: 1,
        filename: "invoice.pdf",
        vendor_name: "Acme",
        invoice_number: "INV-1",
        total_amount: 100,
        date: "2026-06-01",
        due_date: "2026-06-30",
        confidence_score: 0.97,
        status: "approved",
        uploaded_at: "2026-06-01T10:00:00.000Z",
        needs_attention: true,
        attention_reasons: ["low_confidence"],
        reviewed_at: "2026-06-02T10:00:00.000Z",
        line_items: [
          {
            description: "Line A",
            quantity: 1,
            unit_price: 100,
            total_price: 100,
          },
        ],
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      vendor_name: "Acme",
      line_item_description: "Line A",
      attention_reasons: "low_confidence",
    });
  });
});
