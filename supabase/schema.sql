-- Kwacha Tracker schema
-- Paste this whole file into the Supabase dashboard -> SQL Editor -> New query -> Run.
-- Safe to run more than once.

-- ----------------------------------------------------------------------------
-- ACCOUNTS  (where money lives: bank, credit card, mobile money, cash)
-- ----------------------------------------------------------------------------
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  type            text not null check (type in ('bank', 'credit_card', 'mobile_money', 'cash')),
  institution     text,                       -- e.g. Zanaco, Airtel Money, MTN MoMo
  currency        text not null default 'ZMW',
  credit_limit    numeric(14,2),              -- only meaningful for credit cards
  -- Starting balance when the account is created. The live balance is this plus
  -- the effect of every transaction logged against the account. For a credit
  -- card it is the opening amount owed (usually 0).
  opening_balance numeric(14,2) not null default 0,
  created_at      timestamptz not null default now()
);

-- Upgrade existing installs (safe to run repeatedly).
alter table public.accounts add column if not exists opening_balance
  numeric(14,2) not null default 0;

-- ----------------------------------------------------------------------------
-- TRANSACTIONS  (every expense and every bit of income)
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  account_id    uuid references public.accounts (id) on delete set null,
  -- 'transfer' covers a mobile-money cash-out: it moves your own money and so
  -- counts as neither income nor spending (only its fee does).
  direction     text not null check (direction in ('expense', 'income', 'transfer')),
  amount        numeric(14,2) not null check (amount > 0),
  category      text not null default 'Other',
  note          text,
  occurred_on   date not null default current_date,
  -- Mobile-money metadata: op is 'withdraw' | 'send' | 'receive' | 'fee', and
  -- provider is 'mtn' | 'airtel' | 'zamtel'. Both null for plain entries.
  op            text,
  provider      text,
  -- A fee row points at the transaction it was charged for, so deleting that
  -- transaction removes its fee automatically.
  fee_parent_id uuid references public.transactions (id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);

-- Upgrade existing installs (safe to run repeatedly): add the mobile-money
-- columns and widen the direction check to allow transfers.
alter table public.transactions add column if not exists op text;
alter table public.transactions add column if not exists provider text;
alter table public.transactions add column if not exists fee_parent_id
  uuid references public.transactions (id) on delete cascade;
alter table public.transactions drop constraint if exists transactions_direction_check;
alter table public.transactions add constraint transactions_direction_check
  check (direction in ('expense', 'income', 'transfer'));

-- ----------------------------------------------------------------------------
-- GOALS  (what you are saving toward, and by when)
-- ----------------------------------------------------------------------------
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  saved_amount  numeric(14,2) not null default 0 check (saved_amount >= 0),
  target_date   date not null,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- SETTINGS  (one row per user: your monthly expectations)
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  monthly_income_target  numeric(14,2) not null default 0,
  monthly_savings_target numeric(14,2) not null default 0,
  updated_at             timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY: you can only ever touch your own rows
-- ----------------------------------------------------------------------------
alter table public.accounts     enable row level security;
alter table public.transactions enable row level security;
alter table public.goals        enable row level security;
alter table public.settings     enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'transactions', 'goals', 'settings']
  loop
    execute format('drop policy if exists "own rows select" on public.%I', t);
    execute format('drop policy if exists "own rows insert" on public.%I', t);
    execute format('drop policy if exists "own rows update" on public.%I', t);
    execute format('drop policy if exists "own rows delete" on public.%I', t);

    execute format($f$create policy "own rows select" on public.%I
      for select using (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own rows insert" on public.%I
      for insert with check (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own rows update" on public.%I
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own rows delete" on public.%I
      for delete using (auth.uid() = user_id)$f$, t);
  end loop;
end $$;
