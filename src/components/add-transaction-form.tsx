"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTransaction } from "@/app/(app)/transactions/actions";
import { CATEGORIES, type Account } from "@/lib/types";

export function AddTransactionForm({
  accounts,
  today,
}: {
  accounts: Account[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(addTransaction, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear every field once the server confirms the row was saved, so the next
  // transaction starts fresh. Runs on each success (state is a new object every
  // time), so repeated identical entries clear too.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3 lg:grid-cols-6"
    >
      <Field label="Type">
        <select name="kind" className={inputClass} defaultValue="expense">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </Field>

      <Field label="Amount (K)">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className={inputClass}
        />
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
          {accounts.map((a) => (
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

      {state?.error && (
        <p className="col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:col-span-3 lg:col-span-6">
          {state.error}
        </p>
      )}

      <div className="col-span-2 sm:col-span-3 lg:col-span-6">
        <button
          disabled={pending}
          className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {pending ? "Adding..." : "Add transaction"}
        </button>
      </div>
    </form>
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
