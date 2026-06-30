"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  await supabase.from("transactions").insert({
    user_id: user.id,
    direction: kind === "income" ? "income" : "expense",
    amount,
    category: String(formData.get("category") ?? "Other"),
    note: String(formData.get("note") ?? "") || null,
    account_id: String(formData.get("account_id") ?? "") || null,
    occurred_on:
      String(formData.get("occurred_on") ?? "") ||
      new Date().toISOString().slice(0, 10),
  });

  revalidate();
  return { ok: true };
}

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("transactions").delete().eq("id", id);

  revalidate();
}
