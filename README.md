# Kwacha Tracker

A private, single-user money tracker for Zambia. Log your income, expenses,
credit-card charges and mobile-money activity by hand, set savings goals, and
the dashboard tells you how much to save each month and whether you are on
track. Amounts are in Zambian Kwacha (K).

Built with Next.js (App Router) + Supabase (Postgres + Auth), styled with
Tailwind CSS v4.

## What it does

- **Dashboard** — income, spending, net saved and a forecast of month-end
  spend, plus an overspending warning against your income target.
- **Transactions** — add and delete income/expenses, tag a category and an
  account, set the date.
- **Accounts** — bank accounts, credit cards and mobile-money wallets
  (Airtel Money, MTN MoMo, Zamtel Kwacha). Credit cards show a live outstanding
  balance and limit usage from the charges you log.
- **Goals** — set a target and a date; see the required monthly saving and an
  on-track / behind status based on your real saving capacity.
- **Settings** — your expected monthly income and savings target, which power
  the predictions.

## Mobile money fees (MTN, Airtel, Zamtel)

When you log a **Withdraw**, **Send money** or **Receive money** transaction and
pick the operator, the app applies that operator's official tariff and records
the fee as its own linked transaction (so your spending totals stay exact, and
deleting the transfer removes its fee too). Receiving is free; sends also include
the government person-to-person levy.

The tariff tables live in one file, `src/lib/momo-fees.ts`. **Verify the numbers
before relying on them.** Operator tariffs are banded and change over time (the
levy doubled on 1 January 2026), and when these were researched the public
sources disagreed on several bands and Zamtel's official tariff was unreachable.
So Airtel withdrawal is marked verified, MTN and Zamtel are not, and the app
shows an "unverified" warning when you pick an unconfirmed operator. To correct a
rate, edit the number in that file; the whole app updates.

> Migrating an existing install: the transactions table gained `op`, `provider`
> and `fee_parent_id` columns and a new `transfer` direction. Re-run
> `supabase/schema.sql` in the Supabase SQL Editor (it is safe to run again) to
> add them.

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
src/app/(app)/dashboard/     monthly overview + goal status
src/app/(app)/transactions/  add / list / delete transactions
src/app/(app)/accounts/      banks, cards, mobile money + card balances
src/app/(app)/goals/         goals + contributions
src/app/(app)/settings/      income & savings targets
```

## Next steps you might want

- SMS-forwarding endpoint to auto-create transactions from bank/MoMo alerts.
- CSV / PDF statement import.
- Charts for spending by category over time.
- Recurring transactions (rent, salary) auto-added each month.
