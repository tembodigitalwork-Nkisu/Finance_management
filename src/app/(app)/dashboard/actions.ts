"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function upsertSettings(fields: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Upsert only the given columns; the rest keep their existing values (or DB
  // defaults on first insert), so saving the target never wipes income, etc.
  await supabase.from("settings").upsert({
    user_id: user.id,
    ...fields,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/goals");
}

export async function saveSavingsTarget(formData: FormData) {
  await upsertSettings({
    savings_target_amount: Number(formData.get("savings_target_amount") ?? 0),
    savings_target_count: Math.max(
      0,
      Math.trunc(Number(formData.get("savings_target_count") ?? 0)),
    ),
    savings_target_unit: String(formData.get("savings_target_unit") ?? "months"),
  });
}

export async function saveMonthlyIncome(formData: FormData) {
  await upsertSettings({
    monthly_income_target: Number(formData.get("monthly_income_target") ?? 0),
  });
}
