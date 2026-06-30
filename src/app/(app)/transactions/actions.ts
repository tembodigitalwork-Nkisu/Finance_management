"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureSavingsAccount } from "@/lib/savings";

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

  const note = String(formData.get("note") ?? "") || null;
  const occurred_on =
    String(formData.get("occurred_on") ?? "") ||
    new Date().toISOString().slice(0, 10);

  // Move money into the premade Savings account. Optionally deduct it from
  // another account (a transfer); either way it stays out of income/spending.
  if (kind === "savings") {
    const savingsId = await ensureSavingsAccount(user.id);
    if (!savingsId) {
      return { ok: false, error: "Could not find your Savings account." };
    }
    const sourceId = String(formData.get("source_account_id") ?? "") || null;

    const { data: deposit } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: savingsId,
        direction: "income",
        amount,
        category: "Savings deposit",
        is_transfer: true,
        note,
        occurred_on,
      })
      .select("id")
      .single();

    // The optional "deduct from" leg, linked so deleting one removes the other.
    if (deposit && sourceId) {
      await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: sourceId,
        direction: "expense",
        amount,
        category: "Savings deposit",
        is_transfer: true,
        transfer_parent_id: deposit.id,
        occurred_on,
      });
    }

    revalidate();
    return { ok: true };
  }

  // Plain income / expense entry.
  await supabase.from("transactions").insert({
    user_id: user.id,
    direction: kind === "income" ? "income" : "expense",
    amount,
    category: String(formData.get("category") ?? "Other"),
    note,
    account_id: String(formData.get("account_id") ?? "") || null,
    occurred_on,
  });

  revalidate();
  return { ok: true };
}

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Deleting a savings deposit cascades to its "deduct from" leg via the
  // transfer_parent_id FK.
  await supabase.from("transactions").delete().eq("id", id);

  revalidate();
}
