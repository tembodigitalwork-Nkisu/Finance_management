"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addGoal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("goals").insert({
    user_id: user.id,
    name: String(formData.get("name") ?? "").trim(),
    target_amount: Number(formData.get("target_amount") ?? 0),
    saved_amount: Number(formData.get("saved_amount") ?? 0),
    target_date: String(formData.get("target_date") ?? ""),
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

// Add to (or remove from) the amount saved toward a goal.
export async function contribute(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  if (!id || !delta) return;

  const { data: goal } = await supabase
    .from("goals")
    .select("saved_amount")
    .eq("id", id)
    .single();
  if (!goal) return;

  const next = Math.max(0, Number(goal.saved_amount) + delta);
  await supabase.from("goals").update({ saved_amount: next }).eq("id", id);

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function deleteGoal(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("goals").delete().eq("id", id);

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}
