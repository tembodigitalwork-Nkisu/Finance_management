import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { CATEGORIES, type Account, type Transaction } from "@/lib/types";
import { addTransaction, deleteTransaction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [{ data: txns }, { data: accounts }] = await Promise.all([
    supabase.from("transactions").select("*").order("occurred_on", { ascending: false }).limit(200),
    supabase.from("accounts").select("*").order("name"),
  ]);

  const transactions = (txns ?? []) as Transaction[];
  const accountList = (accounts ?? []) as Account[];
  const accountName = (id: string | null) =>
    accountList.find((a) => a.id === id)?.name ?? "Unassigned";

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Transactions</h1>

      {/* Add form */}
      <form
        action={addTransaction}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3 lg:grid-cols-6"
      >
        <Field label="Type">
          <select name="direction" className={inputClass} defaultValue="expense">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </Field>
        <Field label="Amount (K)">
          <input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} />
        </Field>
        <Field label="Category">
          <select name="category" className={inputClass} defaultValue="Other">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Account">
          <select name="account_id" className={inputClass} defaultValue="">
            <option value="">Unassigned</option>
            {accountList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input name="occurred_on" type="date" defaultValue={today} className={inputClass} />
        </Field>
        <Field label="Note">
          <input name="note" type="text" placeholder="optional" className={inputClass} />
        </Field>
        <div className="col-span-2 sm:col-span-3 lg:col-span-6">
          <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
            Add transaction
          </button>
        </div>
      </form>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {transactions.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No transactions yet. Add your first one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Account</th>
                <th className="px-4 py-2">Note</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-500">{t.occurred_on}</td>
                  <td className="px-4 py-2">{t.category}</td>
                  <td className="px-4 py-2 text-slate-500">{accountName(t.account_id)}</td>
                  <td className="px-4 py-2 text-slate-500">{t.note}</td>
                  <td
                    className={
                      "px-4 py-2 text-right font-medium " +
                      (t.direction === "income" ? "text-teal-700" : "text-red-600")
                    }
                  >
                    {t.direction === "income" ? "+" : "-"}
                    {money(Number(t.amount))}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="text-xs text-slate-400 hover:text-red-600">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}
