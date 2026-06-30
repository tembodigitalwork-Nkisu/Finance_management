"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTransaction } from "@/app/(app)/transactions/actions";
import { CATEGORIES, type Account } from "@/lib/types";
import {
  computeMomoFee,
  isVerified,
  PROVIDER_LABELS,
  type MomoOp,
  type Provider,
} from "@/lib/momo-fees";
import { money } from "@/lib/format";

const KINDS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "withdraw", label: "Withdraw (cash out)" },
  { value: "send", label: "Send money" },
  { value: "receive", label: "Receive money" },
] as const;

const PROVIDERS: Provider[] = ["mtn", "airtel", "zamtel"];

export function AddTransactionForm({
  accounts,
  today,
}: {
  accounts: Account[];
  today: string;
}) {
  const [kind, setKind] = useState<string>("expense");
  const [provider, setProvider] = useState<Provider>("mtn");
  const [amount, setAmount] = useState("");

  const [state, formAction, pending] = useActionState(addTransaction, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Once the server confirms the row was saved, clear the entered values so the
  // next transaction starts fresh. Runs on every success (state is a new object
  // each time), so repeated identical entries clear too. Type and provider are
  // kept, since you often log several of the same kind in a row.
  useEffect(() => {
    if (state?.ok) {
      setAmount("");
      formRef.current?.reset();
    }
  }, [state]);

  const isMomo = kind === "withdraw" || kind === "send" || kind === "receive";
  const fee = isMomo ? computeMomoFee(provider, kind as MomoOp, Number(amount) || 0) : null;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3 lg:grid-cols-6"
    >
      <Field label="Type">
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className={inputClass}
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Amount (K)">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* Mobile-money ops pick an operator; everything else picks a category. */}
      {isMomo ? (
        <Field label="Provider">
          <select
            name="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className={inputClass}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Category">
          <select name="category" className={inputClass} defaultValue="Other">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      )}

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

      {/* Live fee preview from the official tables. The server recomputes it on
          submit, so this is purely guidance. */}
      {isMomo && fee && (
        <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-xs sm:col-span-3 lg:col-span-6">
          {kind === "receive" ? (
            <span className="text-teal-700">Receiving money is free.</span>
          ) : (
            <span className="text-slate-600">
              Official {PROVIDER_LABELS[provider]} fee:{" "}
              <strong className="text-slate-900">{money(fee.total)}</strong>
              {fee.levy > 0 ? ` (incl. ${money(fee.levy)} govt levy)` : ""}. Recorded
              as a separate fee.
            </span>
          )}
          {!isVerified(provider) && kind !== "receive" && (
            <span className="mt-1 block text-amber-700">
              {PROVIDER_LABELS[provider]} rates are unverified — confirm against
              the operator&apos;s current tariff.
            </span>
          )}
        </div>
      )}

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
