import { createClient } from "@/lib/supabase/server";
import {
  summarizeMonth,
  goalStatus,
  savingsTargetStatus,
  accountBalance,
} from "@/lib/finance";
import { money } from "@/lib/format";
import type { Account, Transaction, Goal, Settings } from "@/lib/types";
import { Stat } from "@/components/stat";
import { saveSavingsTarget, saveMonthlyIncome } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: txns }, { data: goals }, { data: accounts }, { data: settingsRow }] =
    await Promise.all([
      supabase.from("transactions").select("*").order("occurred_on", { ascending: false }),
      supabase.from("goals").select("*").order("target_date", { ascending: true }),
      supabase.from("accounts").select("*"),
      supabase.from("settings").select("*").maybeSingle(),
    ]);

  const transactions = (txns ?? []) as Transaction[];
  const accountList = (accounts ?? []) as Account[];
  const settings = (settingsRow ?? {
    monthly_income_target: 0,
    savings_target_amount: 0,
    savings_target_count: 0,
    savings_target_unit: "months",
  }) as Settings;

  const m = summarizeMonth(transactions, settings.monthly_income_target);

  // All-time totals (internal transfers such as savings deposits excluded).
  const allIncome = sumWhere(transactions, "income");
  const allExpense = sumWhere(transactions, "expense");
  const allNet = allIncome - allExpense;

  // Money saved = the balance of the premade Savings account.
  const savingsAccount = accountList.find((a) => a.type === "savings");
  const saved = savingsAccount ? accountBalance(transactions, savingsAccount) : 0;
  const target = savingsTargetStatus(
    {
      amount: settings.savings_target_amount,
      count: settings.savings_target_count,
      unit: settings.savings_target_unit,
    },
    saved,
  );

  // Your real saving capacity: the pace you are actually on track for.
  const capacity = Math.max(0, m.projectedNet);

  const overspending = m.projectedExpense > settings.monthly_income_target &&
    settings.monthly_income_target > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overview</h1>
        <Link
          href="/transactions"
          className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Add transaction
        </Link>
      </div>

      {/* All-time balances */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Income balance" value={money(allIncome)} accent="teal" />
        <Stat label="Expense balance" value={money(allExpense)} accent="rose" />
        <Stat
          label="Net balance"
          value={money(allNet)}
          accent={allNet >= 0 ? "teal" : "rose"}
        />
      </div>

      {/* Savings target + progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Savings target</h2>
          {target.hasTarget && (
            <span className="text-sm font-medium text-teal-700">
              {target.percent.toFixed(0)}%
            </span>
          )}
        </div>

        {target.hasTarget ? (
          <>
            <p className="mt-1 text-sm text-slate-600">
              <strong className="text-slate-900">{money(target.saved)}</strong> saved
              of {money(target.amount)} · {money(target.remaining)} to go
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                style={{ width: `${target.percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Target by <strong>{target.targetDate}</strong>. Save about{" "}
              <strong>{money(target.requiredPerMonth)}</strong>/month to get there.
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            Set an amount and a timeframe to track your savings progress. Add money
            with the <strong>Add to savings</strong> type on the Transactions page.
          </p>
        )}

        <form action={saveSavingsTarget} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-xs font-medium text-slate-600">
            Target amount (K)
            <input
              name="savings_target_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.savings_target_amount || ""}
              placeholder="0"
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Within
            <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-teal-600">
              <input
                name="savings_target_count"
                type="number"
                min="1"
                defaultValue={settings.savings_target_count || ""}
                placeholder="0"
                className="w-20 px-2 py-1.5 text-sm outline-none"
              />
              <select
                name="savings_target_unit"
                defaultValue={settings.savings_target_unit || "months"}
                className="border-l border-slate-300 bg-slate-50 px-2 text-sm outline-none"
              >
                <option value="years">years</option>
                <option value="months">months</option>
                <option value="weeks">weeks</option>
                <option value="days">days</option>
              </select>
            </div>
          </label>
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
            Save target
          </button>
        </form>
      </section>

      {/* Expected monthly income — temporary home, pending where you want it */}
      <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Expected monthly income</h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            temporary spot
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Parked here for now. Tell me where you want this to live.
        </p>
        <form action={saveMonthlyIncome} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block text-xs font-medium text-slate-600">
            Amount (K)
            <input
              name="monthly_income_target"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.monthly_income_target || ""}
              placeholder="0"
              className={inputClass}
            />
          </label>
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
            Save
          </button>
        </form>
      </section>

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
            Set your expected monthly income above to unlock budget guidance.
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

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600";

function sumWhere(txns: Transaction[], direction: "income" | "expense"): number {
  return txns
    .filter((t) => t.direction === direction && !t.is_transfer)
    .reduce((acc, t) => acc + Number(t.amount), 0);
}
