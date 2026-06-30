import { createClient } from "@/lib/supabase/server";
import type { Account, Transaction } from "@/lib/types";
import { AddTransactionForm } from "@/components/add-transaction-form";
import { TransactionList } from "@/components/transaction-list";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [{ data: txns }, { data: accounts }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .order("occurred_on", { ascending: false })
      .limit(200),
    supabase.from("accounts").select("*").order("name"),
  ]);

  const all = (txns ?? []) as Transaction[];
  const accountList = (accounts ?? []) as Account[];
  const accountName = (id: string | null) =>
    accountList.find((a) => a.id === id)?.name ?? "Unassigned";

  // A "deduct from" leg points at its savings deposit. Hide those legs from the
  // list, and remember each deposit's source account so it can be shown on expand.
  const sources: Record<string, string> = {};
  for (const t of all) {
    if (t.transfer_parent_id) sources[t.transfer_parent_id] = accountName(t.account_id);
  }
  const items = all.filter((t) => !t.transfer_parent_id);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Transactions</h1>

      <AddTransactionForm accounts={accountList} today={today} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <TransactionList items={items} accounts={accountList} sources={sources} />
      </div>
    </div>
  );
}
