import { createClient } from "@/lib/supabase/server";
import { summarizeMonth, goalStatus } from "@/lib/finance";
import { money, monthLabel } from "@/lib/format";
import type { Transaction, Goal, Settings } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: txns }, { data: goals }, { data: settingsRow }] =
    await Promise.all([
      supabase.from("transactions").select("*").order("occurred_on", { ascending: false }),
      supabase.from("goals").select("*").order("target_date", { ascending: true }),
      supabase.from("settings").select("*").maybeSingle(),
    ]);

  const transactions = (txns ?? []) as Transaction[];
  const settings = (settingsRow ?? {
    monthly_income_target: 0,
    monthly_savings_target: 0,
  }) as Settings;

  const m = summarizeMonth(transactions, settings.monthly_income_target);

  // Your real saving capacity: the bigger of your stated target and the
  // pace you are actually on track for this month.
  const capacity = Math.max(settings.monthly_savings_target, m.projectedNet);

  const overspending = m.projectedExpense > settings.monthly_income_target &&
    settings.monthly_income_target > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{monthLabel()}</h1>
          <p className="text-sm text-slate-500">
            Day {m.dayOfMonth} of {m.daysInMonth}
          </p>
        </div>
        <Link
          href="/transactions"
          className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Add transaction
        </Link>
      </div>

      {/* Top line numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Income this month" value={money(m.income)} accent="teal" />
        <Stat label="Spent this month" value={money(m.expense)} accent="rose" />
        <Stat
          label="Net saved so far"
          value={money(m.net)}
          accent={m.net >= 0 ? "teal" : "rose"}
        />
        <Stat label="Forecast month-end spend" value={money(m.projectedExpense)} accent="amber" />
      </div>

      {/* Spending guidance — tinted by whether you are on course or over budget */}
      <section
        className={
          "rounded-2xl border p-5 " +
          (settings.monthly_income_target > 0
            ? overspending
              ? "border-rose-100 bg-rose-50"
              : "border-teal-100 bg-teal-50"
            : "border-slate-200 bg-white")
        }
      >
        <h2 className="mb-2 font-semibold">Spending pace</h2>
        {settings.monthly_income_target > 0 ? (
          <p className="text-sm text-slate-600">
            At your current pace you will spend{" "}
            <strong>{money(m.projectedExpense)}</strong> this month against an
            expected income of{" "}
            <strong>{money(settings.monthly_income_target)}</strong>.{" "}
            {overspending ? (
              <span className="text-red-600">
                That puts you over budget by{" "}
                {money(m.projectedExpense - settings.monthly_income_target)}. Ease
                off, or expect to dip into savings.
              </span>
            ) : (
              <span className="text-teal-700">
                You are on course to keep{" "}
                {money(settings.monthly_income_target - m.projectedExpense)} this
                month. Nice.
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Set a monthly income target in{" "}
            <Link href="/settings" className="text-teal-700 underline">
              Settings
            </Link>{" "}
            to unlock budget guidance.
          </p>
        )}
      </section>

      {/* Goals */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Goals</h2>
          <Link href="/goals" className="text-sm text-teal-700 hover:underline">
            Manage goals
          </Link>
        </div>

        {(goals ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No goals yet. Add one in{" "}
            <Link href="/goals" className="text-teal-700 underline">
              Goals
            </Link>{" "}
            and the dashboard will tell you how much to save each month and whether
            you are on track.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(goals as Goal[]).map((goal) => {
              const s = goalStatus(goal, capacity);
              return (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{goal.name}</h3>
                      <p className="text-xs text-slate-500">
                        {money(goal.saved_amount)} of {money(goal.target_amount)}
                      </p>
                    </div>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-medium " +
                        (s.onTrack
                          ? "bg-teal-100 text-teal-800"
                          : "bg-red-100 text-red-700")
                      }
                    >
                      {s.onTrack ? "On track" : "Behind"}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    Save <strong>{money(s.requiredPerMonth)}</strong>/month for{" "}
                    {s.monthsLeft} more {s.monthsLeft === 1 ? "month" : "months"}.
                    {!s.onTrack && s.shortfallPerMonth > 0 && (
                      <span className="text-red-600">
                        {" "}
                        You are short {money(s.shortfallPerMonth)}/month at your
                        current pace.
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

type Accent = "teal" | "rose" | "amber" | "slate";

const STAT_CARD: Record<Accent, string> = {
  teal: "border-teal-100 bg-teal-50",
  rose: "border-rose-100 bg-rose-50",
  amber: "border-amber-100 bg-amber-50",
  slate: "border-slate-200 bg-white",
};

const STAT_VALUE: Record<Accent, string> = {
  teal: "text-teal-700",
  rose: "text-rose-600",
  amber: "text-amber-700",
  slate: "text-slate-900",
};

function Stat({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: Accent;
}) {
  return (
    <div className={"rounded-2xl border p-4 " + STAT_CARD[accent]}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={"mt-1 text-lg font-semibold " + STAT_VALUE[accent]}>{value}</p>
    </div>
  );
}
