import AgSidebar from "@/components/ag/app/AgSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-[5] bg-[#07080f]/45" aria-hidden />
      <AgSidebar />
      <main className="relative min-w-0 flex-1 overflow-auto p-6 lg:p-8">
        <div className="ag-main-surface min-h-[calc(100vh-4rem)] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
