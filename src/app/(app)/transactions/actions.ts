"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  computeMomoFee,
  PROVIDER_LABELS,
  MOMO_OP_LABELS,
  type MomoOp,
  type Provider,
} from "@/lib/momo-fees";
import { money } from "@/lib/format";

const MOMO_OPS = ["withdraw", "send", "receive"] as const;
const isMomoOp = (k: string): k is MomoOp =>
  (MOMO_OPS as readonly string[]).includes(k);

// Returned to the form via useActionState so it can show errors and only clear
// the inputs once the row has actually been saved.
export type AddState = { ok: boolean; error?: string } | null;

function revalidate() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

export async function addTransaction(
  _prev: AddState,
  formData: FormData,
): Promise<AddState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You are not signed in." };

  const kind = String(formData.get("kind") ?? "expense");
  const amount = Number(formData.get("amount") ?? 0);
  if (!(amount > 0)) {
    return { ok: false, error: "Enter an amount greater than zero." };
  }

  const accountId = String(formData.get("account_id") ?? "") || null;
  const note = String(formData.get("note") ?? "") || null;
  const occurred_on =
    String(formData.get("occurred_on") ?? "") ||
    new Date().toISOString().slice(0, 10);

  // Plain income / expense entry.
  if (!isMomoOp(kind)) {
    await supabase.from("transactions").insert({
      user_id: user.id,
      direction: kind === "income" ? "income" : "expense",
      amount,
      category: String(formData.get("category") ?? "Other"),
      note,
      account_id: accountId,
      occurred_on,
    });
    revalidate();
    return { ok: true };
  }

  // Mobile-money operation: record the principal, then its official fee as a
  // separate, linked transaction so totals and balances stay exact.
  const op = kind;
  const provider = String(formData.get("provider") ?? "mtn") as Provider;
  const direction =
    op === "receive" ? "income" : op === "send" ? "expense" : "transfer";

  const { data: principal } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      direction,
      amount,
      category: "Mobile money",
      op,
      provider,
      note,
      account_id: accountId,
      occurred_on,
    })
    .select("id")
    .single();

  // Fee is computed server-side from the official tables — never trusted from
  // the client. Only stored when there is actually a charge (receiving is free).
  const fee = computeMomoFee(provider, op, amount);
  if (principal && fee.total > 0) {
    const desc =
      `${PROVIDER_LABELS[provider]} ${MOMO_OP_LABELS[op].toLowerCase()} fee` +
      (fee.levy > 0 ? ` (incl. ${money(fee.levy)} govt levy)` : "");
    await supabase.from("transactions").insert({
      user_id: user.id,
      direction: "expense",
      amount: fee.total,
      category: "Mobile money fee",
      op: "fee",
      provider,
      fee_parent_id: principal.id,
      account_id: accountId,
      occurred_on,
      note: desc,
    });
  }

  revalidate();
  return { ok: true };
}

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Deleting a principal cascades to its fee row via the fee_parent_id FK.
  await supabase.from("transactions").delete().eq("id", id);

  revalidate();
}
