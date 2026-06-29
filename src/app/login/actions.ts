"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return error.message;
  redirect("/dashboard");
}

export async function signUp(_prev: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) return error.message;

  // Seed a settings row so the dashboard has defaults to read.
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.from("settings").upsert({ user_id: data.user.id });
  }

  // If email confirmation is off (recommended for a private personal app),
  // the user is signed in immediately.
  const { data: session } = await supabase.auth.getSession();
  if (session.session) redirect("/dashboard");

  return "Check your email to confirm your account, then sign in.";
}
