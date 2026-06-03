"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Shield, Palette, Database, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HoverCard } from "@/components/TiltCard";

const fade = { 
  initial: { opacity: 0, y: 14 }, 
  animate: { opacity: 1, y: 0 } 
};

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-[var(--ag-text-secondary)]">
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-[var(--ag-text-tertiary)]">{children}</p>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none ${
        checked ? "bg-[var(--ag-gradient-primary)] shadow-[0_0_12px_-2px_rgba(139,92,246,0.8)]" : "bg-white/10"
      }`}
    >
      <span
        className={`pointer-events-none mt-0.5 inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[1.125rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SectionCard({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <HoverCard className="p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-[var(--ag-border)] pb-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--ag-border)] bg-[var(--ag-gradient-surface)]">
          <Icon className="h-4 w-4 text-[var(--ag-primary-400)]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--ag-text-tertiary)]">{description}</p>
        </div>
      </div>
      {children}
    </HoverCard>
  );
}

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--ag-border)] bg-[var(--ag-surface-glass)] p-3.5">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--ag-text-tertiary)]">{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const [emailNotifs, setEmailNotifs]   = useState(true);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [retentionDays, setRetentionDays] = useState(90);
  const [dateFormat, setDateFormat]     = useState("MM/DD/YYYY");
  const [currency, setCurrency]         = useState("USD ($)");
  const [pageSize, setPageSize]         = useState("15");
  const [saving, setSaving]             = useState(false);
  const [securityFlags, setSecurityFlags] = useState({ audit: true, twofa: false, iplist: false });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success("Settings saved");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <motion.div {...fade} className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">
            Settings
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ag-text-tertiary)]">
            Configure your DocuExtract workspace
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
            : <><Save className="h-3.5 w-3.5" /> Save Settings</>}
        </button>
      </motion.div>

      {/* Row 1 */}
      <motion.div {...fade} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SectionCard icon={Bell} title="Notifications" description="Alerts for invoice pipeline events">
            <div className="space-y-3">
              <ToggleRow label="Email notifications" sub="Daily digest of review queue activity" checked={emailNotifs} onChange={setEmailNotifs} />
              <div>
                <Label htmlFor="slack">Slack Webhook URL</Label>
                <input id="slack" className="field-input" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/…" />
                <Hint>Post alerts to Slack when invoices are approved or flagged for review.</Hint>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Database} title="Data & Retention" description="Storage and cleanup policies">
            <div className="space-y-4">
              <div>
                <Label htmlFor="retention">
                  Document retention — <span className="gradient-text font-black">{retentionDays} days</span>
                </Label>
                <input
                  id="retention"
                  type="range" min={30} max={365} step={30}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[var(--ag-primary-500)]"
                />
                <div className="mt-1 flex justify-between text-xs text-[var(--ag-text-tertiary)]">
                  <span>30 days</span>
                  <span>1 year</span>
                </div>
                <Hint>Rejected and processed invoices older than this are automatically deleted.</Hint>
              </div>
            </div>
          </SectionCard>
        </div>
      </motion.div>

      {/* Row 2 */}
      <motion.div {...fade} transition={{ delay: 0.15 }}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SectionCard icon={Shield} title="Security" description="Access control and audit settings">
            <div className="space-y-3">
              {([
                { key: "audit"  as const, label: "Audit log",                   sub: "Record all approve/reject actions" },
                { key: "twofa"  as const, label: "Require 2FA for bulk actions", sub: "Confirm identity before bulk deletes" },
                { key: "iplist" as const, label: "IP allowlist",                 sub: "Restrict to specific IP ranges (Enterprise)" },
              ]).map((item) => (
                <ToggleRow
                  key={item.key}
                  label={item.label}
                  sub={item.sub}
                  checked={securityFlags[item.key]}
                  onChange={(v) => setSecurityFlags((f) => ({ ...f, [item.key]: v }))}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Palette} title="Workspace" description="Display and personal preferences">
            <div className="space-y-4">
              <div>
                <Label htmlFor="date-format">Date format</Label>
                <select id="date-format" className="field-input" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD (ISO)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select id="currency" className="field-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                  <option>JPY (¥)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="page-size">Default page size</Label>
                <select id="page-size" className="field-input" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                  <option value="15">15 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
            </div>
          </SectionCard>
        </div>
      </motion.div>
    </div>
  );
}
