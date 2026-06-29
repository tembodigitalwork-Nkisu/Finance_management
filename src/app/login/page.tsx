"use client";

import { useActionState } from "react";
import { signIn, signUp } from "./actions";

export default function LoginPage() {
  const [signInMsg, doSignIn, signingIn] = useActionState(signIn, null);
  const [signUpMsg, doSignUp, signingUp] = useActionState(signUp, null);
  const message = signInMsg ?? signUpMsg;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={36} height={36} />
          <div>
            <h1 className="text-lg font-semibold">Kwacha Tracker</h1>
            <p className="text-xs text-slate-500">Your private money dashboard</p>
          </div>
        </div>

        <form className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>

          {message && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {message}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              formAction={doSignIn}
              disabled={signingIn || signingUp}
              className="flex-1 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {signingIn ? "Signing in..." : "Sign in"}
            </button>
            <button
              formAction={doSignUp}
              disabled={signingIn || signingUp}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {signingUp ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
