const companies = [
  "Northwind",
  "Lumen Foods",
  "Atlas Freight",
  "Verda Health",
  "Quanta Labs",
  "Brightline",
  "Hearth & Co.",
  "Meridian",
];

export function Logos() {
  return (
    <section className="relative border-y border-line/60 py-10">
      <p className="mb-7 text-center text-[0.72rem] font-medium uppercase tracking-[0.2em] text-ink-mute">
        Trusted by finance & operations teams
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-14 pr-14">
          {[...companies, ...companies].map((c, i) => (
            <span
              key={i}
              className="select-none whitespace-nowrap text-lg font-semibold tracking-tight text-ink-faint transition-colors hover:text-ink-soft"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
