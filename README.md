# Kwacha Tracker

A private, single-user money tracker for Zambia. Log your income, expenses,
credit-card charges and mobile-money activity by hand, set savings goals, and
the dashboard tells you how much to save each month and whether you are on
track. Amounts are in Zambian Kwacha (K).

Built with Next.js (App Router) + Supabase (Postgres + Auth), styled with
Tailwind CSS v4.

## What it does

- **Dashboard** — income, spending, net saved and a forecast of month-end
  spend, an overspending warning, and a **savings target** (an amount within a
  custom timeframe) with a progress bar tracking your Savings account.
- **Transactions** — add and delete income/expenses, or **Add to savings**
  (optionally deducting from another account). Tag a category and an account,
  set the date.
- **Accounts** — bank accounts, credit cards, mobile-money wallets and a
  premade **Savings** account, each with a live balance. Credit cards also show
  limit usage from the charges you log.
- **Goals** — set a target and a date; see the required monthly saving and an
  on-track / behind status based on your real saving capacity.

## A note on "automatic" bank data

Zambian banks and mobile-money providers do not offer open-banking APIs that let
an app read your personal transactions. So this app uses **manual entry**. The
data model (an `accounts` table + an `import`-friendly `transactions` table) is
built so SMS-alert parsing or statement/CSV import can be added later without
changing the schema.

## Setup

### 1. Create a Supabase project

1. Go to https://supabase.com, create a free project.
2. In **Project Settings -> API**, copy the **Project URL** and the **anon
   public** key.
3. In **Authentication -> Providers -> Email**, turn **"Confirm email" off**
   (recommended for a private personal app, so sign-up logs you straight in).

### 2. Create the database tables

Open **SQL Editor -> New query**, paste the entire contents of
`supabase/schema.sql`, and click **Run**.

### 3. Add your environment variables

Copy `.env.local.example` to `.env.local` and fill in your two values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and run

In this project folder, type these with the `!` prefix in Claude Code (or run
them in your own terminal):

```
! npm install
! npm run dev
```

Then open http://localhost:3000, click **Create account**, and you are in.

## Install it on your phone

Kwacha Tracker is a PWA (progressive web app), so it installs to your home
screen and runs full-screen like a native app, no app store needed. It must be
served over HTTPS first (localhost cannot be installed), so deploy it (Vercel's
free tier works) and open that URL on your phone.

- **Android (Chrome):** open the site, tap the **⋮** menu, then **Install app**
  (or **Add to Home screen**).
- **iPhone (Safari):** open the site, tap the **Share** button, then
  **Add to Home Screen**.

You will get the Kwacha icon on your home screen; launching it opens the app
without browser bars. If you are offline it shows a simple "you are offline"
screen rather than a browser error, since live balances need a connection.

## Project layout

```
supabase/schema.sql          database tables + row-level security
src/lib/finance.ts           the prediction engine (savings + on-track logic)
src/lib/format.ts            Kwacha currency formatting
src/lib/supabase/            browser, server and middleware Supabase clients
src/app/login/               sign in / sign up
src/app/(app)/dashboard/     monthly overview, savings target + income
src/app/(app)/transactions/  add / list / delete transactions
src/app/(app)/accounts/      banks, cards, mobile money, savings + balances
src/app/(app)/goals/         goals + contributions
src/lib/savings.ts           premade Savings account provisioning
```

## Next steps you might want

- SMS-forwarding endpoint to auto-create transactions from bank/MoMo alerts.
- CSV / PDF statement import.
- Charts for spending by category over time.
- Recurring transactions (rent, salary) auto-added each month.
