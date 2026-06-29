// Zambian Kwacha formatting. "ZMW" is the ISO code; the symbol is "K".
const kwacha = new Intl.NumberFormat("en-ZM", {
  style: "currency",
  currency: "ZMW",
  currencyDisplay: "symbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value: number): string {
  // Guard against NaN / null sneaking in from empty form fields.
  return kwacha.format(Number.isFinite(value) ? value : 0);
}

export function monthLabel(date = new Date()): string {
  return date.toLocaleDateString("en-ZM", { month: "long", year: "numeric" });
}

// First and last calendar day of the month containing `ref`, as YYYY-MM-DD.
export function monthBounds(ref = new Date()) {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}
