import { createClient } from "@/lib/supabase/server";
import type { Settings } from "@/lib/types";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").maybeSingle();
  const settings = (data ?? {
    monthly_income_target: 0,
    monthly_savings_target: 0,
  }) as Settings;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-slate-500">
        These two numbers drive your budget guidance and your saving capacity
        estimate. All amounts are in Zambian Kwacha (K).
      </p>

      <form action={saveSettings} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-medium text-slate-700">
          Expected monthly income (K)
          <input
            name="monthly_income_target"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.monthly_income_target}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Your salary plus any reliable income. Used to flag overspending.
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Monthly savings target (K)
          <input
            name="monthly_savings_target"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.monthly_savings_target}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
          <span className="mt-1 block text-xs text-slate-500">
            How much you aim to set aside each month. Used to judge if your goals
            are reachable.
          </span>
        </label>

        <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
          Save settings
        </button>
      </form>
    </div>
  );
}
