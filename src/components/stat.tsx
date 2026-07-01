// A small tinted stat card, shared by the dashboard (all-time) and the
// transactions page (selected month). The accent carries meaning: teal for
// money in, rose for money out, amber for forecasts.
export type Accent = "teal" | "rose" | "amber" | "slate";

const CARD: Record<Accent, string> = {
  teal: "border-teal-100 bg-teal-50",
  rose: "border-rose-100 bg-rose-50",
  amber: "border-amber-100 bg-amber-50",
  slate: "border-slate-200 bg-white",
};

const VALUE: Record<Accent, string> = {
  teal: "text-teal-700",
  rose: "text-rose-600",
  amber: "text-amber-700",
  slate: "text-slate-900",
};

export function Stat({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: Accent;
}) {
  return (
    <div className={"rounded-2xl border p-4 " + CARD[accent]}>
      <p className="text-base font-bold text-slate-800">{label}</p>
      <p className={"mt-1 text-lg font-semibold " + VALUE[accent]}>{value}</p>
    </div>
  );
}
