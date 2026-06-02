import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

// Attach Supabase session token to every request
api.interceptors.request.use(async (config) => {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const { createClient } = await import("./supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch {}
  }
  return config;
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

export interface Timeseries {
  weekly: { day: string; date: string; total: number; approved: number; rejected: number }[];
  monthly: { month: string; total: number; value: number }[];
}

export interface PaginatedInvoices {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
