import AgBackground from "@/components/ag/background/AgBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--ag-surface-container)] p-4">
      <AgBackground variant="light" />
      {children}
    </div>
  );
}
