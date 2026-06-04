import { describe, expect, it } from "vitest";
import { buildSummary } from "./admin-server";

describe("buildSummary", () => {
  it("derives platform quality and review-load rankings from invoice rows", () => {
    const users = [
      {
        id: "user-a",
        name: "Alpha User",
        email: "alpha@example.com",
        created_at: "2026-06-01T10:00:00.000Z",
        last_sign_in_at: "2026-06-03T10:00:00.000Z",
        is_admin: false,
        is_bootstrap_admin: false,
        invoice_count: 0,
        total_value: 0,
        approved_count: 0,
        review_count: 0,
        rejected_count: 0,
        processing_count: 0,
        failed_count: 0,
        last_invoice_at: null,
      },
      {
        id: "user-b",
        name: "Beta User",
        email: "beta@example.com",
        created_at: "2026-06-02T10:00:00.000Z",
        last_sign_in_at: "2026-06-03T11:00:00.000Z",
        is_admin: false,
        is_bootstrap_admin: false,
        invoice_count: 0,
        total_value: 0,
        approved_count: 0,
        review_count: 0,
        rejected_count: 0,
        processing_count: 0,
        failed_count: 0,
        last_invoice_at: null,
      },
    ];

    const invoices = [
      {
        id: 1,
        user_id: "user-a",
        status: "review",
        total_amount: 120,
        confidence_score: 74,
        needs_attention: true,
        uploaded_at: "2026-06-03T10:00:00.000Z",
        filename: "acme-a.pdf",
        vendor_name: "Acme",
        invoice_number: "A-1",
        duplicate_of_invoice_id: null,
        attention_reasons: ["low_confidence"],
      },
      {
        id: 2,
        user_id: "user-a",
        status: "approved",
        total_amount: 90,
        confidence_score: 88,
        needs_attention: false,
        uploaded_at: "2026-06-03T11:00:00.000Z",
        filename: "acme-b.pdf",
        vendor_name: "Acme",
        invoice_number: "A-2",
        duplicate_of_invoice_id: 1,
        attention_reasons: ["duplicate_upload"],
      },
      {
        id: 3,
        user_id: "user-b",
        status: "failed",
        total_amount: 50,
        confidence_score: null,
        needs_attention: true,
        uploaded_at: "2026-06-03T12:00:00.000Z",
        filename: "beta.pdf",
        vendor_name: "Beta Co",
        invoice_number: "B-1",
        duplicate_of_invoice_id: null,
        attention_reasons: ["empty_extraction"],
      },
    ] as any;

    const summary = buildSummary(users as any, invoices);

    expect(summary.total_invoices).toBe(3);
    expect(summary.attention).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.attention_rate).toBe(66.7);
    expect(summary.failed_extraction_rate).toBe(33.3);
    expect(summary.duplicate_upload_rate).toBe(33.3);
    expect(summary.top_users[0]?.id).toBe("user-a");
    expect(summary.review_load_users[0]?.id).toBe("user-a");
    expect(summary.duplicate_heavy_users[0]?.id).toBe("user-a");
    expect(summary.top_vendors[0]?.label).toBe("Acme");
    expect(summary.attention_invoices[0]?.id).toBe(1);
    expect(summary.failed_invoices[0]?.id).toBe(3);
  });
});
