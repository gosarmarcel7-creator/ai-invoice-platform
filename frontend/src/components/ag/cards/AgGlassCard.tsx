import { cn } from "@/lib/utils";

export default function AgGlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={cn("ag-card ag-glass rounded-2xl", glow && "ag-card-glow", className)}>
      {children}
    </div>
  );
}
