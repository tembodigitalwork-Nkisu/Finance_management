import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { goalStatus, summarizeMonth } from "@/lib/finance";
import type { Goal, Settings, Transaction } from "@/lib/types";
import { addGoal, contribute, deleteGoal } from "./actions";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = await createClient();

  const [{ data: goals }, { data: settingsRow }, { data: txns }] =
    await Promise.all([
      supabase.from("goals").select("*").order("target_date"),
      supabase.from("settings").select("*").maybeSingle(),
      supabase.from("transactions").select("*"),
    ]);

  const goalList = (goals ?? []) as Goal[];
  const settings = (settingsRow ?? {
    monthly_income_target: 0,
    monthly_savings_target: 0,
  }) as Settings;
  const transactions = (txns ?? []) as Transaction[];

  const m = summarizeMonth(transactions, settings.monthly_income_target);
  const capacity = Math.max(settings.monthly_savings_target, m.projectedNet);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Savings goals</h1>
      <p className="text-sm text-slate-500">
        Your estimated saving capacity is{" "}
        <strong>{money(capacity)}</strong>/month (the larger of your savings
        target and your forecast net this month).
      </p>

      <form
        action={addGoal}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4"
      >
        <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
          Goal name
          <input name="name" required placeholder="Emergency fund" className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Target (K)
          <input name="target_amount" type="number" step="0.01" min="0.01" required className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Already saved (K)
          <input name="saved_amount" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
          Target date
          <input name="target_date" type="date" required min={today} className={inputClass} />
        </label>
        <div className="col-span-2 sm:col-span-4">
          <button className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 sm:w-auto">
            Add goal
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {goalList.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No goals yet. Add one above to see how much to save each month.
          </p>
        ) : (
          goalList.map((goal) => {
            const s = goalStatus(goal, capacity);
            return (
              <div key={goal.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{goal.name}</h3>
                    <p className="text-xs text-slate-500">
                      Target {money(goal.target_amount)} by {goal.target_date}
                    </p>
                  </div>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-medium " +
                      (s.onTrack ? "bg-teal-100 text-teal-800" : "bg-red-100 text-red-700")
                    }
                  >
                    {s.onTrack ? "On track" : "Behind"}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${s.percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {money(goal.saved_amount)} saved · {money(s.remaining)} to go ·{" "}
                  {s.percent.toFixed(0)}%
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  Save <strong>{money(s.requiredPerMonth)}</strong>/month for{" "}
                  {s.monthsLeft} more {s.monthsLeft === 1 ? "month" : "months"}.
                  {!s.onTrack && s.shortfallPerMonth > 0 && (
                    <span className="text-red-600">
                      {" "}
                      Short {money(s.shortfallPerMonth)}/month.
                    </span>
                  )}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <form action={contribute} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={goal.id} />
                    <input
                      name="delta"
                      type="number"
                      step="0.01"
                      placeholder="Add amount"
                      className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
                    />
                    <button className="rounded-lg bg-teal-700 px-3 py-1 text-sm font-medium text-white hover:bg-teal-800">
                      Save
                    </button>
                  </form>
                  <form action={deleteGoal} className="ml-auto">
                    <input type="hidden" name="id" value={goal.id} />
                    <button className="text-xs text-slate-400 hover:text-red-600">Delete</button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600";
