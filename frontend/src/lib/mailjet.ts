import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoiceStatus } from "@/lib/types";

const MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send";
const DEFAULT_FROM_EMAIL = "no-reply@docuextract.xyz";
const DEFAULT_FROM_NAME = "DocuExtract";

type MailjetRecipient = {
  Email: string;
  Name?: string;
};

type SendMailjetEmailArgs = {
  to: MailjetRecipient[];
  subject: string;
  text: string;
  html?: string;
};

type MailjetResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
};

type PasswordResetEmailContext = {
  to: MailjetRecipient;
  actionLink: string;
};

type InvoiceEmailContext = {
  invoiceId: number;
  userId: string;
  supabaseAdmin: SupabaseClient;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
};

type InvoiceRow = {
  id: number;
  filename: string;
  vendor_name: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  status: InvoiceStatus;
  last_error: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  needs_attention?: boolean | null;
  attention_reasons?: unknown;
};

function getMailjetConfig() {
  const apiKey = process.env.MAILJET_API_KEY?.trim();
  const apiSecret = process.env.MAILJET_API_SECRET?.trim();
  const fromEmail = process.env.MAILJET_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const fromName = process.env.MAILJET_FROM_NAME?.trim() || DEFAULT_FROM_NAME;

  if (!apiKey || !apiSecret) {
    return null;
  }

  return { apiKey, apiSecret, fromEmail, fromName };
}

export function isMailjetConfigured() {
  return Boolean(getMailjetConfig());
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatAmount(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return value.toFixed(2);
}

function getInvoiceTitle(invoice: InvoiceRow) {
  return invoice.vendor_name?.trim() || invoice.invoice_number?.trim() || invoice.filename;
}

function shouldNotify(fromStatus: InvoiceStatus, toStatus: InvoiceStatus) {
  if (toStatus === "review") return fromStatus === "processing";
  return toStatus === "approved" || toStatus === "rejected" || toStatus === "failed";
}

async function getRecipient(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<{ email: string; name: string | null } | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return null;

  const metadata = data.user.user_metadata as Record<string, unknown> | undefined;
  const nameFromMeta =
    typeof metadata?.full_name === "string"
      ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : null;

  return {
    email: data.user.email,
    name: nameFromMeta || data.user.email.split("@")[0] || null,
  };
}

function buildNotificationCopy(invoice: InvoiceRow, toStatus: InvoiceStatus) {
  const title = getInvoiceTitle(invoice);
  const amount = formatAmount(invoice.total_amount);
  const lines = [
    `Invoice: ${title}`,
    `Filename: ${invoice.filename}`,
    `Invoice number: ${invoice.invoice_number ?? "n/a"}`,
    `Vendor: ${invoice.vendor_name ?? "n/a"}`,
    `Total: ${amount}`,
  ];

  if (toStatus === "review") {
    return {
      subject: `Invoice ready for review: ${title}`,
      text: [
        "Your invoice is ready for review.",
        "",
        ...lines,
        "",
        "Open DocuExtract to review and approve or reject it.",
      ].join("\n"),
    };
  }

  if (toStatus === "approved") {
    return {
      subject: `Invoice approved: ${title}`,
      text: [
        "Your invoice was approved.",
        "",
        ...lines,
        "",
        `Reviewed by: ${invoice.reviewed_by ?? "n/a"}`,
        `Reviewed at: ${invoice.reviewed_at ?? "n/a"}`,
      ].join("\n"),
    };
  }

  if (toStatus === "rejected") {
    return {
      subject: `Invoice rejected: ${title}`,
      text: [
        "Your invoice was rejected.",
        "",
        ...lines,
        "",
        `Reviewed by: ${invoice.reviewed_by ?? "n/a"}`,
        `Reviewed at: ${invoice.reviewed_at ?? "n/a"}`,
      ].join("\n"),
    };
  }

  return {
    subject: `Invoice processing failed: ${title}`,
    text: [
      "We could not finish processing your invoice.",
      "",
      ...lines,
      "",
      `Last error: ${invoice.last_error ?? "n/a"}`,
    ].join("\n"),
  };
}

function buildNotificationHtml(invoice: InvoiceRow, toStatus: InvoiceStatus) {
  const title = escapeHtml(getInvoiceTitle(invoice));
  const filename = escapeHtml(invoice.filename);
  const vendor = escapeHtml(invoice.vendor_name ?? "n/a");
  const invoiceNumber = escapeHtml(invoice.invoice_number ?? "n/a");
  const amount = escapeHtml(formatAmount(invoice.total_amount));
  const statusText =
    toStatus === "review"
      ? "ready for review"
      : toStatus === "approved"
        ? "approved"
        : toStatus === "rejected"
          ? "rejected"
          : "failed";

  return `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin: 0 0 12px; font-size: 20px;">Invoice ${statusText}: ${title}</h2>
      <p style="margin: 0 0 16px;">${escapeHtml(
        toStatus === "review"
          ? "Your invoice is ready for review."
          : toStatus === "approved"
            ? "Your invoice was approved."
            : toStatus === "rejected"
              ? "Your invoice was rejected."
              : "We could not finish processing your invoice."
      )}</p>
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tr><td style="padding: 6px 0; color: #475569; width: 180px;">Invoice</td><td style="padding: 6px 0; font-weight: 600;">${title}</td></tr>
        <tr><td style="padding: 6px 0; color: #475569;">Filename</td><td style="padding: 6px 0;">${filename}</td></tr>
        <tr><td style="padding: 6px 0; color: #475569;">Invoice number</td><td style="padding: 6px 0;">${invoiceNumber}</td></tr>
        <tr><td style="padding: 6px 0; color: #475569;">Vendor</td><td style="padding: 6px 0;">${vendor}</td></tr>
        <tr><td style="padding: 6px 0; color: #475569;">Total</td><td style="padding: 6px 0;">${amount}</td></tr>
        ${
          toStatus === "approved" || toStatus === "rejected"
            ? `<tr><td style="padding: 6px 0; color: #475569;">Reviewed by</td><td style="padding: 6px 0;">${escapeHtml(invoice.reviewed_by ?? "n/a")}</td></tr>
               <tr><td style="padding: 6px 0; color: #475569;">Reviewed at</td><td style="padding: 6px 0;">${escapeHtml(invoice.reviewed_at ?? "n/a")}</td></tr>`
            : ""
        }
        ${
          toStatus === "failed"
            ? `<tr><td style="padding: 6px 0; color: #475569;">Last error</td><td style="padding: 6px 0;">${escapeHtml(invoice.last_error ?? "n/a")}</td></tr>`
            : ""
        }
      </table>
      <p style="margin: 20px 0 0; color: #475569;">
        Open DocuExtract to continue the workflow.
      </p>
    </div>
  `;
}

export async function sendMailjetEmail({ to, subject, text, html }: SendMailjetEmailArgs): Promise<MailjetResult> {
  const config = getMailjetConfig();
  if (!config) {
    return { ok: true, skipped: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(MAILJET_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: config.fromEmail,
              Name: config.fromName,
            },
            To: to,
            Subject: subject,
            TextPart: text,
            ...(html ? { HTMLPart: html } : {}),
          },
        ],
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Mailjet returned ${response.status}: ${responseText.slice(0, 300)}`,
      };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Mailjet request failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendInvoiceStatusEmail({
  invoiceId,
  userId,
  supabaseAdmin,
  fromStatus,
  toStatus,
}: InvoiceEmailContext): Promise<MailjetResult> {
  if (!shouldNotify(fromStatus, toStatus)) {
    return { ok: true, skipped: true };
  }

  const recipient = await getRecipient(supabaseAdmin, userId);
  if (!recipient?.email) {
    return { ok: true, skipped: true };
  }

  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .select("id, filename, vendor_name, invoice_number, total_amount, status, last_error, reviewed_by, reviewed_at, needs_attention, attention_reasons")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single<InvoiceRow>();

  if (error || !invoice) {
    return {
      ok: false,
      error: error?.message ?? "Unable to load invoice details for Mailjet notification.",
    };
  }

  const { subject, text } = buildNotificationCopy(invoice, toStatus);
  const html = buildNotificationHtml(invoice, toStatus);

  return sendMailjetEmail({
    to: [{ Email: recipient.email, Name: recipient.name ?? undefined }],
    subject,
    text,
    html,
  });
}

export async function sendMailjetTestEmail({
  supabaseAdmin,
  userId,
}: {
  supabaseAdmin: SupabaseClient;
  userId: string;
}): Promise<MailjetResult> {
  if (!process.env.MAILJET_API_KEY?.trim() || !process.env.MAILJET_API_SECRET?.trim()) {
    return { ok: false, error: "Mailjet API credentials are not configured." };
  }

  const recipient = await getRecipient(supabaseAdmin, userId);
  if (!recipient?.email) {
    return { ok: false, error: "No recipient email is available for this account." };
  }

  return sendMailjetEmail({
    to: [{ Email: recipient.email, Name: recipient.name ?? undefined }],
    subject: "DocuExtract Mailjet test",
    text: [
      "This is a test email from DocuExtract.",
      "",
      "If you received this, Mailjet is configured correctly.",
    ].join("\n"),
    html: `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin: 0 0 12px; font-size: 20px;">DocuExtract Mailjet test</h2>
        <p style="margin: 0 0 12px;">This is a test email from DocuExtract.</p>
        <p style="margin: 0;">If you received this, Mailjet is configured correctly.</p>
      </div>
    `,
  });
}

export async function sendMailjetPasswordResetEmail({
  to,
  actionLink,
}: PasswordResetEmailContext): Promise<MailjetResult> {
  const config = getMailjetConfig();
  if (!config) {
    return { ok: false, error: "Mailjet API credentials are not configured." };
  }

  const resetLink = escapeHtml(actionLink);

  return sendMailjetEmail({
    to: [to],
    subject: "Reset your DocuExtract password",
    text: [
      "You requested a password reset for your DocuExtract account.",
      "",
      "Use this link to set a new password:",
      actionLink,
      "",
      "If you did not request this reset, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin: 0 0 12px; font-size: 20px;">Reset your DocuExtract password</h2>
        <p style="margin: 0 0 12px;">You requested a password reset for your DocuExtract account.</p>
        <p style="margin: 0 0 18px;">
          <a href="${resetLink}" style="display: inline-block; border-radius: 10px; background: #111827; color: #ffffff; padding: 12px 18px; text-decoration: none; font-weight: 600;">
            Set a new password
          </a>
        </p>
        <p style="margin: 0 0 12px; color: #475569; font-size: 14px; word-break: break-all;">
          Or paste this link into your browser:<br />
          ${resetLink}
        </p>
        <p style="margin: 0; color: #475569;">If you did not request this reset, you can ignore this email.</p>
      </div>
    `,
  });
}
