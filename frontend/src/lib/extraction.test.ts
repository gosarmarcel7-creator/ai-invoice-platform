import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  complete: vi.fn(),
}));

vi.mock("@mistralai/mistralai", () => ({
  Mistral: class {
    chat = {
      complete: mocks.complete,
    };
  },
}));

describe("extractInvoiceData", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("throws when the Mistral API key is missing", async () => {
    vi.stubEnv("MISTRAL_API_KEY", "");

    const { extractInvoiceData } = await import("./extraction");

    await expect(extractInvoiceData("Vendor: Acme Corp")).rejects.toThrow(
      "MISTRAL_API_KEY is not configured."
    );
  });

  it("throws when the model response is not valid JSON", async () => {
    vi.stubEnv("MISTRAL_API_KEY", "test-key");
    mocks.complete.mockResolvedValue({
      choices: [
        {
          message: {
            content: "not-json",
          },
        },
      ],
    });

    const { extractInvoiceData } = await import("./extraction");

    await expect(extractInvoiceData("Vendor: Acme Corp")).rejects.toThrow();
  });

  it("recovers JSON that is wrapped in extra prose or fences", async () => {
    vi.stubEnv("MISTRAL_API_KEY", "test-key");
    mocks.complete.mockResolvedValue({
      choices: [
        {
          message: {
            content: [
              {
                text: [
                  "Here is the extraction you asked for:",
                  "```json",
                  '{"vendor_name":"Acme Corp","invoice_number":"INV-1001","total_amount":120,"date":"2026-06-01","due_date":"2026-06-30","confidence_score":0.98,"line_items":[]}',
                  "```",
                ].join("\n"),
              },
            ],
          },
        },
      ],
    });

    const { extractInvoiceData } = await import("./extraction");

    await expect(extractInvoiceData("Vendor: Acme Corp")).resolves.toMatchObject({
      vendor_name: "Acme Corp",
      invoice_number: "INV-1001",
      total_amount: 120,
    });
  });
});
