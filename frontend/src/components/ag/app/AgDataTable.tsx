import { cn } from "@/lib/utils";

export function AgDataTable({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <table className={cn("ag-data-table w-full", className)}>{children}</table>;
}

export function AgTableWrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("ag-card overflow-hidden", className)}>
      {children}
    </div>
  );
}
