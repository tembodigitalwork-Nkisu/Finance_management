import { createClient } from "@/lib/supabase/server";

export const SAVINGS_ACCOUNT_NAME = "Savings";

// Returns the user's premade Savings account id, creating it the first time it
// is needed. Called from the app layout so the account is always present, and
// from the "add to savings" action so a deposit always has somewhere to land.
export async function ensureSavingsAccount(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "savings")
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created } = await supabase
    .from("accounts")
    .insert({ user_id: userId, name: SAVINGS_ACCOUNT_NAME, type: "savings" })
    .select("id")
    .single();
  return created?.id ?? null;
}
