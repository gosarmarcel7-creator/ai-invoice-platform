export type InvoiceStatus = "processing" | "review" | "approved" | "rejected" | "failed";

export type AttentionReason =
  | "low_confidence"
  | "total_mismatch"
  | "missing_vendor"
  | "missing_invoice_number"
  | "missing_total_amount"
  | "missing_date"
  | "empty_extraction"
  | "duplicate_upload";

export interface LineItem {
  id?: number;
  invoice_id?: number;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
}

export interface Invoice {
  id: number;
  user_id?: string;
  filename: string;
  raw_text?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  file_hash?: string | null;
  duplicate_of_invoice_id?: number | null;
  vendor_name: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  date: string | null;
  due_date: string | null;
  confidence_score: number | null;
  needs_attention?: boolean;
  attention_reasons?: AttentionReason[];
  processing_started_at?: string | null;
  processed_at?: string | null;
  last_error?: string | null;
  retry_count?: number;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  status: InvoiceStatus;
  uploaded_at: string | null;
  line_items?: LineItem[];
}

export interface InvoiceAuditEntry {
  id: number;
  invoice_id: number;
  user_id: string | null;
  action: string;
  from_status: InvoiceStatus | null;
  to_status: InvoiceStatus | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface InvoiceListResponse {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Analytics {
  total_documents: number;
  processing: number;
  awaiting_review: number;
  approved: number;
  rejected: number;
  failed?: number;
  attention?: number;
  total_value: number;
  avg_confidence: number;
}

export interface TimeSeries {
  weekly: { day: string; date: string; total: number; approved: number; rejected: number }[];
  monthly: { month: string; total: number; value: number }[];
}

export const STATUS_META: Record<
  InvoiceStatus,
  { label: string; color: string; tone: string; dot: string }
> = {
  processing: { label: "Processing", color: "var(--color-processing)", tone: "text-[#38bdf8]", dot: "bg-[#38bdf8]" },
  review: { label: "Needs review", color: "var(--color-review)", tone: "text-[#f59e0b]", dot: "bg-[#f59e0b]" },
  approved: { label: "Approved", color: "var(--color-approved)", tone: "text-[#10b981]", dot: "bg-[#10b981]" },
  rejected: { label: "Rejected", color: "var(--color-rejected)", tone: "text-[#f43f5e]", dot: "bg-[#f43f5e]" },
  failed: { label: "Failed", color: "var(--color-rejected)", tone: "text-[#f43f5e]", dot: "bg-[#f43f5e]" },
};
