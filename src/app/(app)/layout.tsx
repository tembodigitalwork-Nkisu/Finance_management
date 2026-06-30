import { Nav } from "@/components/nav";
import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { ensureSavingsAccount } from "@/lib/savings";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Make sure the premade Savings account exists for this user.
  if (user) await ensureSavingsAccount(user.id);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="" width={20} height={20} />
            </span>
            <span className="font-semibold">Kwacha Tracker</span>
          </div>
          {/* Pill nav is desktop-only; phones get the bottom tab bar instead. */}
          <div className="hidden sm:block">
            <Nav />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">{user?.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-50">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {/* Extra bottom padding on mobile so content clears the fixed tab bar. */}
      <main className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}
