import { fireEvent, render, screen } from "@testing-library/react";
import { InvoiceDrawer } from "@/components/dashboard/invoice-drawer";
import type { Invoice } from "@/lib/types";

const invoice: Invoice = {
  id: 1,
  filename: "failed-invoice.pdf",
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

    fireEvent.click(screen.getByRole("button", { name: /retry extraction/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
