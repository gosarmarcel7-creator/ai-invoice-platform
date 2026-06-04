import type { Invoice, InvoiceStatus, LineItem } from "@/lib/types";

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg"]);
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LOW_CONFIDENCE_THRESHOLD = 0.75;
const TOTAL_TOLERANCE = 0.01;

type UploadInput = {
  name: string;
  type: string;
  size: number;
};

type ExtractionLineItem = {
  description?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total_price?: number | null;
};

type ExtractionInput = {
  vendor_name?: string | null;
  invoice_number?: string | null;
  total_amount?: number | null;
  date?: string | null;
  due_date?: string | null;
  confidence_score?: number | null;
  line_items?: ExtractionLineItem[] | null;
};

export type AttentionReason =
  | "low_confidence"
  | "total_mismatch"
  | "missing_vendor"
  | "missing_invoice_number"
  | "missing_total_amount"
  | "missing_date"
  | "empty_extraction";

export type ValidatedExtraction = {
  vendor_name: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  date: string | null;
  due_date: string | null;
  confidence_score: number | null;
  line_items: LineItem[];
};

export function sanitizeDatabaseText(value: string) {
  return value.replace(/\u0000/g, "");
}

export function validateUpload(input: UploadInput):
  | { ok: true; normalizedMimeType: string; normalizedExtension: string }
  | { ok: false; error: string } {
  const extension = normalizeExtension(input.name);
  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    return { ok: false, error: "Unsupported file type. Upload PDF, PNG, JPG, or JPEG files." };
  }

  const mimeType = normalizeMimeType(input.type, extension);
  if (!mimeType || !SUPPORTED_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: "Unsupported file type. Upload PDF, PNG, JPG, or JPEG files." };
  }

  if (input.size <= 0) {
    return { ok: false, error: "File is empty." };
  }

  if (input.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      ok: false,
      error: `File exceeds the ${Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))}MB upload limit.`,
    };
  }

  return { ok: true, normalizedMimeType: mimeType, normalizedExtension: extension };
}

export function normalizeExtension(name: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match?.[1]?.toLowerCase() ?? null;
}

export function normalizeMimeType(type: string, extension: string | null) {
  const normalizedType = type?.toLowerCase().trim();
  const inferredType =
    extension === "pdf"
      ? "application/pdf"
      : extension === "png"
        ? "image/png"
        : extension === "jpg" || extension === "jpeg"
          ? "image/jpeg"
          : null;

  if (normalizedType && SUPPORTED_MIME_TYPES.has(normalizedType)) {
    return normalizedType;
  }

  if (!normalizedType || normalizedType === "application/octet-stream") {
    return inferredType;
  }

  return null;
}

export function canRetryInvoice(status: InvoiceStatus) {
  return status === "failed";
}

export function computeAttentionReasons(input: ExtractionInput): AttentionReason[] {
  const reasons = new Set<AttentionReason>();
  const lineItems = sanitizeLineItems(input.line_items);
  const confidence = normalizeNullableNumber(input.confidence_score);

  if (confidence != null && confidence < LOW_CONFIDENCE_THRESHOLD) {
    reasons.add("low_confidence");
  }
  if (!input.vendor_name?.trim()) reasons.add("missing_vendor");
  if (!input.invoice_number?.trim()) reasons.add("missing_invoice_number");
  if (normalizeNullableNumber(input.total_amount) == null) reasons.add("missing_total_amount");
  if (!input.date?.trim()) reasons.add("missing_date");

  const lineTotal = sumLineItems(lineItems);
  const headerTotal = normalizeNullableNumber(input.total_amount);
  if (
    headerTotal != null &&
    lineItems.length > 0 &&
    Math.abs(headerTotal - lineTotal) > TOTAL_TOLERANCE
  ) {
    reasons.add("total_mismatch");
  }

  const noStructuredFields =
    !input.vendor_name?.trim() &&
    !input.invoice_number?.trim() &&
    headerTotal == null &&
    lineItems.length === 0;
  if (noStructuredFields) reasons.add("empty_extraction");

  return Array.from(reasons);
}

export function validateExtractionResult(input: ExtractionInput):
  | {
      ok: true;
      status: "review";
      needsAttention: boolean;
      attentionReasons: AttentionReason[];
      data: ValidatedExtraction;
    }
  | { ok: false; error: string } {
  const date = normalizeNullableString(input.date);
  const dueDate = normalizeNullableString(input.due_date);
  const confidence = normalizeNullableNumber(input.confidence_score);

  if (date && !DATE_RE.test(date)) {
    return { ok: false, error: "Extraction result contains an invalid date." };
  }
  if (dueDate && !DATE_RE.test(dueDate)) {
    return { ok: false, error: "Extraction result contains an invalid due date." };
  }
  if (confidence != null && (confidence < 0 || confidence > 1)) {
    return { ok: false, error: "Extraction result contains an invalid confidence score." };
  }

  const lineItems = sanitizeLineItems(input.line_items);
  const totalAmount = normalizeNullableNumber(input.total_amount);
  const sanitized: ValidatedExtraction = {
    vendor_name: normalizeNullableString(input.vendor_name),
    invoice_number: normalizeNullableString(input.invoice_number),
    total_amount: totalAmount,
    date,
    due_date: dueDate,
    confidence_score: confidence,
    line_items: lineItems,
  };

  const attentionReasons = computeAttentionReasons(sanitized);
  if (attentionReasons.includes("empty_extraction")) {
    return { ok: false, error: "Extraction result is empty or unusable." };
  }

  return {
    ok: true,
    status: "review",
    needsAttention: attentionReasons.length > 0,
    attentionReasons,
    data: sanitized,
  };
}

export function buildCsvRows(invoices: Invoice[]) {
  return invoices.flatMap((invoice) => {
    const reasons = invoice.attention_reasons?.join(", ") ?? "";
    const baseRow = {
      id: invoice.id,
      filename: invoice.filename,
      vendor_name: invoice.vendor_name ?? "",
      invoice_number: invoice.invoice_number ?? "",
      total_amount: invoice.total_amount ?? "",
      date: invoice.date ?? "",
      due_date: invoice.due_date ?? "",
      confidence_score: invoice.confidence_score ?? "",
      status: invoice.status,
      needs_attention: invoice.needs_attention ? "yes" : "no",
      attention_reasons: reasons,
      reviewed_at: invoice.reviewed_at ?? "",
    };

    const lineItems = invoice.line_items?.length ? invoice.line_items : [null];
    return lineItems.map((item) => ({
      ...baseRow,
      line_item_description: item?.description ?? "",
      line_item_quantity: item?.quantity ?? "",
      line_item_unit_price: item?.unit_price ?? "",
      line_item_total_price: item?.total_price ?? "",
    }));
  });
}

function sanitizeLineItems(items: ExtractionInput["line_items"]): LineItem[] {
  return (items ?? []).map((item) => {
    const quantity = normalizeNullableNumber(item.quantity);
    const unitPrice = normalizeNullableNumber(item.unit_price);
    const providedTotal = normalizeNullableNumber(item.total_price);
    const computedTotal =
      quantity != null && unitPrice != null ? roundCurrency(quantity * unitPrice) : null;

    return {
      description: normalizeNullableString(item.description),
      quantity,
      unit_price: unitPrice,
      total_price: providedTotal ?? computedTotal,
    };
  });
}

function sumLineItems(items: LineItem[]) {
  return roundCurrency(items.reduce((sum, item) => sum + (item.total_price ?? 0), 0));
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeNullableString(value: string | null | undefined) {
  const trimmed = value == null ? null : sanitizeDatabaseText(value).trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableNumber(value: number | null | undefined) {
  if (value == null) return null;
  return Number.isFinite(value) ? value : null;
}
