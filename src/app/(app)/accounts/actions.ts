"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const creditLimit = formData.get("credit_limit");
  const opening = formData.get("opening_balance");

  await supabase.from("accounts").insert({
    user_id: user.id,
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? "bank"),
    institution: String(formData.get("institution") ?? "") || null,
    credit_limit: creditLimit ? Number(creditLimit) : null,
    opening_balance: opening ? Number(opening) : 0,
  });

  revalidatePath("/accounts");
  revalidatePath("/transactions");
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("accounts").delete().eq("id", id);

  revalidatePath("/accounts");
  revalidatePath("/transactions");
}
