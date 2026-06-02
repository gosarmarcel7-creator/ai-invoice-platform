import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

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
  filename: string;
  status: string;
  uploaded_at: string;
  vendor_name: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  date: string | null;
  due_date: string | null;
  confidence_score: number | null;
  raw_text?: string | null;
  notes?: string | null;
  line_items: LineItem[];
}

export interface Analytics {
  total_documents: number;
  processing: number;
  awaiting_review: number;
  approved: number;
  rejected: number;
  total_value: number;
  avg_confidence: number;
}

export interface PaginatedInvoices {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
