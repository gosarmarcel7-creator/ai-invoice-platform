"use client";

import { useState } from "react";
import {
  Key, Bell, Shield, Palette, Database,
  Save, Eye, EyeOff, RefreshCw, Loader2,
  Globe, Zap,
} from "lucide-react";
import { toast } from "sonner";

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-stone-700 mb-1.5">
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">{children}</p>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none ${
        checked ? "bg-stone-900" : "bg-stone-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
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
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-100">
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-stone-600" />
        </div>
        <div>
          <h2 className="font-bold text-stone-900 text-sm">{title}</h2>
          <p className="text-xs text-stone-400 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg border border-stone-100 bg-stone-50">
      <div>
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const [apiKey, setApiKey]       = useState("");
  const [showKey, setShowKey]     = useState(false);
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000");
  const [model, setModel]         = useState("mistral-large-latest");
  const [confidence, setConfidence] = useState(75);
  const [autoApprove, setAutoApprove] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [retentionDays, setRetentionDays] = useState(90);
  const [saving, setSaving]       = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [securityFlags, setSecurityFlags] = useState({ audit: true, twofa: false, iplist: false });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success("Settings saved");
  };

  const testConnection = async () => {
    setTestingConn(true);
    try {
      const res = await fetch(`${backendUrl}/api/health`);
      if (res.ok) toast.success("Backend connected successfully");
      else toast.error("Backend returned an error");
    } catch {
      toast.error("Could not reach backend");
    } finally {
      setTestingConn(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-900">Settings</h1>
          <p className="text-sm text-stone-400 mt-0.5">Configure your DocuExtract workspace</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary text-sm disabled:opacity-50"
        >
          {saving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            : <><Save className="w-3.5 h-3.5" /> Save Settings</>}
        </button>
      </div>

      {/* Top row: AI + Backend side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* AI Configuration */}
        <SectionCard icon={Zap} title="AI Configuration" description="Mistral AI API and extraction model settings">
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key">Mistral API Key</Label>
              <div className="relative">
                <input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  className="field-input pr-10"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Mistral API key…"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Hint>Get your key from <span className="text-stone-600 font-medium">console.mistral.ai</span>. Leave blank to use mock extraction data.</Hint>
            </div>

            <div>
              <Label htmlFor="model">Extraction Model</Label>
              <select id="model" className="field-input" value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="mistral-large-latest">Mistral Large (Best accuracy)</option>
                <option value="mistral-small-latest">Mistral Small (Fast, cost-efficient)</option>
                <option value="open-mistral-nemo">Mistral Nemo (Lightweight)</option>
              </select>
              <Hint>Mistral Large is recommended for complex or multi-language invoices.</Hint>
            </div>

            <div>
              <Label htmlFor="confidence">
                Confidence Threshold — <span className="font-black text-stone-900">{confidence}%</span>
              </Label>
              <input
                id="confidence"
                type="range" min={50} max={99}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>50% — more to review</span>
                <span>99% — fewer to review</span>
              </div>
            </div>

            <ToggleRow
              label="Auto-approve high confidence"
              sub="Skip human review when AI confidence is ≥95%"
              checked={autoApprove}
              onChange={setAutoApprove}
            />
          </div>
        </SectionCard>

        {/* Backend */}
        <SectionCard icon={Globe} title="Backend Connection" description="FastAPI server endpoint configuration">
          <div className="space-y-4">
            <div>
              <Label htmlFor="backend-url">API Base URL</Label>
              <div className="flex gap-2">
                <input
                  id="backend-url"
                  className="field-input flex-1"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                />
                <button
                  onClick={testConnection}
                  disabled={testingConn}
                  className="btn btn-secondary text-sm shrink-0 disabled:opacity-50"
                >
                  {testingConn
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  Test
                </button>
              </div>
              <Hint>Set via <span className="font-mono text-stone-600 text-[11px]">NEXT_PUBLIC_API_URL</span> env var at build time. Changing here reloads the page.</Hint>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Supabase Database</p>
              <div>
                <Label htmlFor="db-url">DATABASE_URL</Label>
                <input
                  id="db-url"
                  type="password"
                  className="field-input"
                  placeholder="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
                />
                <Hint>Set in <span className="font-mono text-stone-600 text-[11px]">backend/.env</span>. Leave blank to use local SQLite.</Hint>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Second row: Notifications + Data */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Notifications */}
        <SectionCard icon={Bell} title="Notifications" description="Alerts for invoice pipeline events">
          <div className="space-y-3">
            <ToggleRow
              label="Email notifications"
              sub="Daily digest of review queue activity"
              checked={emailNotifs}
              onChange={setEmailNotifs}
            />
            <div>
              <Label htmlFor="slack">Slack Webhook URL</Label>
              <input
                id="slack"
                className="field-input"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/…"
              />
              <Hint>Post alerts to Slack when invoices are approved or flagged for review.</Hint>
            </div>
          </div>
        </SectionCard>

        {/* Data retention */}
        <SectionCard icon={Database} title="Data & Retention" description="Storage and cleanup policies">
          <div className="space-y-4">
            <div>
              <Label htmlFor="retention">
                Document retention — <span className="font-black text-stone-900">{retentionDays} days</span>
              </Label>
              <input
                id="retention"
                type="range" min={30} max={365} step={30}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>30 days</span>
                <span>1 year</span>
              </div>
              <Hint>Rejected and processed invoices older than this are automatically deleted.</Hint>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Third row: Security + Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Security */}
        <SectionCard icon={Shield} title="Security" description="Access control and audit settings">
          <div className="space-y-3">
            {([
              { key: "audit"  as const, label: "Audit log",                    sub: "Record all approve/reject actions with timestamps" },
              { key: "twofa"  as const, label: "Require 2FA for bulk actions",  sub: "Confirm identity before bulk deletes or exports" },
              { key: "iplist" as const, label: "IP allowlist",                  sub: "Restrict access to specific IP ranges (Enterprise)" },
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

        {/* Workspace */}
        <SectionCard icon={Palette} title="Workspace" description="Display and personal preferences">
          <div className="space-y-4">
            <div>
              <Label htmlFor="date-format">Date format</Label>
              <select id="date-format" className="field-input">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD (ISO)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select id="currency" className="field-input">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
                <option>JPY (¥)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="page-size">Default page size</Label>
              <select id="page-size" className="field-input">
                <option value="15">15 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
