export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full opacity-100 blur-[120px] animate-aurora"
        style={{ background: "radial-gradient(circle, rgba(34,197,94,0.10), transparent 62%)" }}
      />
      <div
        className="absolute -top-24 right-[8%] h-[26rem] w-[26rem] rounded-full opacity-100 blur-[120px] animate-aurora"
        style={{ background: "radial-gradient(circle, rgba(10,10,10,0.05), transparent 62%)", animationDelay: "-7s" }}
      />
    </div>
  );
}
