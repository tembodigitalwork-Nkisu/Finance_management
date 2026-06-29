"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const accountId = String(formData.get("account_id") ?? "");

  await supabase.from("transactions").insert({
    user_id: user.id,
    direction: String(formData.get("direction") ?? "expense"),
    amount: Number(formData.get("amount") ?? 0),
    category: String(formData.get("category") ?? "Other"),
    note: String(formData.get("note") ?? "") || null,
    account_id: accountId || null,
    occurred_on:
      String(formData.get("occurred_on") ?? "") ||
      new Date().toISOString().slice(0, 10),
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("transactions").delete().eq("id", id);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}
