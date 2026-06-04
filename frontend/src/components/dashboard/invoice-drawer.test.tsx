import { fireEvent, render, screen } from "@testing-library/react";
import { InvoiceDrawer } from "@/components/dashboard/invoice-drawer";
import type { Invoice } from "@/lib/types";

const invoice: Invoice = {
  id: 1,
  filename: "failed-invoice.pdf",
  raw_text: "Vendor: ACME Supplies\nInvoice # 12345\nTotal: $120.00",
  vendor_name: null,
  invoice_number: null,
  total_amount: null,
  date: null,
  due_date: null,
  confidence_score: null,
  status: "failed",
  uploaded_at: "2026-06-03T10:00:00.000Z",
  needs_attention: true,
  attention_reasons: ["empty_extraction"],
  last_error: "Invoice extraction failed.",
  line_items: [],
};

describe("InvoiceDrawer", () => {
  it("shows retry controls and attention flags for failed invoices", () => {
    const onRetry = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(
      <InvoiceDrawer
        invoice={invoice}
        history={[]}
        loadingHistory={false}
        onClose={() => {}}
        onSave={() => {}}
        onStatus={() => {}}
        onDelete={() => {}}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText("Extraction failed")).toBeInTheDocument();
    expect(screen.getByText("Attention flags")).toBeInTheDocument();
    expect(screen.getByText("Source preview")).toBeInTheDocument();
    expect(screen.getByText(/Vendor: ACME Supplies/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry extraction/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /copy source/i }));
    expect(writeText).toHaveBeenCalledWith(invoice.raw_text);
  });
});
