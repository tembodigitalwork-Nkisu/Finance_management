import { createClient } from "@/lib/supabase/server";
import type { Account, Transaction } from "@/lib/types";
import { money, monthLabel } from "@/lib/format";
import { Stat } from "@/components/stat";
import { MonthPicker } from "@/components/month-picker";
import { AddTransactionForm } from "@/components/add-transaction-form";
import { TransactionList } from "@/components/transaction-list";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();

  const [{ data: txns }, { data: accounts }] = await Promise.all([
    supabase.from("transactions").select("*").order("occurred_on", { ascending: false }),
    supabase.from("accounts").select("*").order("name"),
  ]);

  const all = (txns ?? []) as Transaction[];
  const accountList = (accounts ?? []) as Account[];
  const accountName = (id: string | null) =>
    accountList.find((a) => a.id === id)?.name ?? "Unassigned";

  // Which month to show: ?month=YYYY-MM, defaulting to the current month.
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const raw = (await searchParams).month ?? "";
  const selectedMonth = /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonth;

  const inMonth = all.filter((t) => t.occurred_on.slice(0, 7) === selectedMonth);

  // Monthly income and spending exclude internal transfers (e.g. into Savings).
  const income = sumWhere(inMonth, "income");
  const spending = sumWhere(inMonth, "expense");

  // Hide the "deduct from" legs; remember each deposit's source for the details.
  const sources: Record<string, string> = {};
  for (const t of inMonth) {
    if (t.transfer_parent_id) sources[t.transfer_parent_id] = accountName(t.account_id);
  }
  const items = inMonth.filter((t) => !t.transfer_parent_id);

  const [y, mi] = selectedMonth.split("-").map(Number);
  const label = monthLabel(new Date(y, mi - 1, 1));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <MonthPicker value={selectedMonth} max={currentMonth} />
      </div>

      {/* Income and spending for the selected month */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label={`Income in ${label}`} value={money(income)} accent="teal" />
        <Stat label={`Spending in ${label}`} value={money(spending)} accent="rose" />
      </div>

      <AddTransactionForm accounts={accountList} today={today} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <TransactionList items={items} accounts={accountList} sources={sources} />
      </div>
    </div>
  );
}

function sumWhere(txns: Transaction[], direction: "income" | "expense"): number {
  return txns
    .filter((t) => t.direction === direction && !t.is_transfer)
    .reduce((acc, t) => acc + Number(t.amount), 0);
}
