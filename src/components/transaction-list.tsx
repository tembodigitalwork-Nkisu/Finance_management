"use client";

import { useState } from "react";
import { deleteTransaction } from "@/app/(app)/transactions/actions";
import { money } from "@/lib/format";
import { MOMO_OP_LABELS, PROVIDER_LABELS, type MomoOp, type Provider } from "@/lib/momo-fees";
import type { Account, Transaction } from "@/lib/types";

// A collapsible list: each transaction shows a one-line summary and expands to
// reveal account, note, any mobile-money fee, and delete. This replaces the wide
// table, which did not fit narrow screens.
export function TransactionList({
  items,
  fees,
  accounts,
}: {
  items: Transaction[];
  fees: Record<string, Transaction>;
  accounts: Account[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (items.length === 0) {
    return (
      <p className="p-5 text-sm text-slate-500">
        No transactions yet. Add your first one above.
      </p>
    );
  }

  const accountName = (id: string | null) =>
    accounts.find((a) => a.id === id)?.name ?? "Unassigned";

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((t) => {
        const isOpen = !!open[t.id];
        const fee = fees[t.id];
        const isMomo = !!t.op && t.op !== "fee" && !!t.provider;
        const title = isMomo
          ? `${PROVIDER_LABELS[t.provider as Provider]} · ${MOMO_OP_LABELS[t.op as MomoOp]}`
          : t.category;

        const sign = t.direction === "income" ? "+" : t.direction === "expense" ? "-" : "";
        const amountColor =
          t.direction === "income"
            ? "text-teal-700"
            : t.direction === "expense"
              ? "text-red-600"
              : "text-slate-500";

        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [t.id]: !o[t.id] }))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Chevron open={isOpen} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{title}</span>
                  <span className="block text-xs text-slate-500">
                    {t.occurred_on}
                    {t.direction === "transfer" ? " · transfer" : ""}
                  </span>
                </span>
              </span>
              <span className={"shrink-0 text-sm font-medium " + amountColor}>
                {sign}
                {money(Number(t.amount))}
              </span>
            </button>

            {isOpen && (
              <div className="space-y-1.5 px-4 pb-4 pl-10 text-sm">
                <Detail label="Account" value={accountName(t.account_id)} />
                {t.note && <Detail label="Note" value={t.note} />}
                {fee && (
                  <Detail
                    label="Fee charged"
                    value={`${money(Number(fee.amount))}${fee.note ? ` — ${fee.note}` : ""}`}
                  />
                )}
                <div className="pt-1.5">
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:border-red-300 hover:text-red-600">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-slate-600">
      <span className="text-slate-400">{label}: </span>
      {value}
    </p>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={"h-4 w-4 shrink-0 text-slate-400 transition-transform " + (open ? "rotate-90" : "")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
