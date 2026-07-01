"use client";

import { useRouter } from "next/navigation";

// Picks which month the transactions page shows. Navigates to
// /transactions?month=YYYY-MM so the (server) page can filter by it.
export function MonthPicker({ value, max }: { value: string; max: string }) {
  const router = useRouter();
  return (
    <input
      type="month"
      value={value}
      max={max}
      onChange={(e) =>
        router.push(
          e.target.value ? `/transactions?month=${e.target.value}` : "/transactions",
        )
      }
      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600"
    />
  );
}
