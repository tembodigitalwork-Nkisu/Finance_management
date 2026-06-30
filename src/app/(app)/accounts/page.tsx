import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { accountBalance } from "@/lib/finance";
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
  type Transaction,
} from "@/lib/types";
import { addAccount, deleteAccount } from "./actions";

export const dynamic = "force-dynamic";

const ZAMBIAN_HINTS: Record<AccountType, string> = {
  bank: "e.g. Zanaco, Stanbic, FNB, Absa, Indo Zambia",
  credit_card: "e.g. Stanbic Visa, FNB Credit",
  mobile_money: "e.g. Airtel Money, MTN MoMo, Zamtel Kwacha",
  cash: "e.g. Wallet",
};

export default async function AccountsPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: txns }] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at"),
    supabase.from("transactions").select("*"),
  ]);

  const accountList = (accounts ?? []) as Account[];
  const transactions = (txns ?? []) as Transaction[];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Accounts</h1>
      <p className="text-sm text-slate-500">
        Bank accounts, credit cards and mobile money wallets. Credit cards show
        their outstanding balance from the charges you log.
      </p>

      <form
        action={addAccount}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4"
      >
        <label className="block text-xs font-medium text-slate-600 sm:col-span-1">
          Type
          <select name="type" className={inputClass} defaultValue="bank">
            {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Name
          <input name="name" required placeholder="My Zanaco" className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Institution
          <input name="institution" placeholder="Zanaco" className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Opening balance (K)
          <input name="opening_balance" type="number" step="0.01" defaultValue="0" className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Credit limit (cards only)
          <input name="credit_limit" type="number" step="0.01" min="0" placeholder="optional" className={inputClass} />
        </label>
        <div className="col-span-2 sm:col-span-4">
          <button className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 sm:w-auto">
            Add account
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {accountList.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No accounts yet. Add your bank, a credit card, or a mobile money
            wallet above. Hints: {ZAMBIAN_HINTS.bank}; {ZAMBIAN_HINTS.mobile_money}.
          </p>
        ) : (
          accountList.map((a) => {
            const isCard = a.type === "credit_card";
            const balance = accountBalance(transactions, a);
            const usage =
              isCard && a.credit_limit ? (balance / a.credit_limit) * 100 : null;
            return (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{a.name}</h3>
                    <p className="text-xs text-slate-500">
                      {ACCOUNT_TYPE_LABELS[a.type]}
                      {a.institution ? ` · ${a.institution}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* For a card this is debt owed; for everything else it is
                        money available. */}
                    <p
                      className={
                        "text-lg font-semibold " +
                        (isCard
                          ? "text-red-600"
                          : balance < 0
                            ? "text-red-600"
                            : "text-slate-900")
                      }
                    >
                      {money(balance)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isCard ? "owed" : "balance"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Opened with {money(a.opening_balance)}
                  </span>
                  <form action={deleteAccount}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-slate-400 hover:text-red-600">
                      Delete
                    </button>
                  </form>
                </div>

                {isCard && usage !== null && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500">
                      {money(balance)} of {money(a.credit_limit ?? 0)} limit used
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={
                          "h-full rounded-full " +
                          (usage > 80 ? "bg-red-500" : "bg-amber-400")
                        }
                        style={{ width: `${Math.min(100, Math.max(0, usage))}%` }}
                      />
                    </div>
                  </div>
                )}
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
