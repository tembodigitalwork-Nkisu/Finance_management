"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("settings").upsert({
    user_id: user.id,
    monthly_income_target: Number(formData.get("monthly_income_target") ?? 0),
    monthly_savings_target: Number(formData.get("monthly_savings_target") ?? 0),
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/goals");
}
