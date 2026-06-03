import AgBackground from "@/components/ag/background/AgBackground";
import AgSidebar from "@/components/ag/app/AgSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-[var(--ag-surface-container)]">
      <AgBackground variant="light" />
      <AgSidebar />
      <main className="relative min-w-0 flex-1 overflow-auto p-6 lg:p-8">
        <div className="ag-main-surface min-h-[calc(100vh-4rem)] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
