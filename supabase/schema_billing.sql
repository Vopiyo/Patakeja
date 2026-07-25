-- ============================================================
-- PataKeja — Billing schema (subscriptions + M-Pesa payments)
-- Run this AFTER schema.sql, in the SQL Editor.
--
-- Design: the client never writes to `subscriptions` or `payments`
-- directly — only the "initiate-payment" and "intasend-webhook"
-- Edge Functions do, using the service role key, which bypasses
-- RLS entirely. That's deliberate: if a user could INSERT their
-- own subscription row, they could grant themselves "Pro" for
-- free. Regular users can only ever READ their own rows here.
-- ============================================================

-- ---------- subscriptions ----------
-- One row per user, holding their CURRENT plan. Updated by the
-- webhook once a payment is confirmed — never by the client.
create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'standard', 'pro')),
  status text not null default 'active' check (status in ('active', 'expired')),
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can view their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy for regular users on purpose —
-- see the note above. The Edge Functions use the service role
-- key and are unaffected by RLS.

-- ---------- payments ----------
-- A log of every M-Pesa payment attempt, so you (and the user)
-- can see what happened, and so the webhook has something to
-- match its callback against via provider_ref.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan text not null check (plan in ('standard', 'pro')),
  amount numeric not null,
  phone text not null,
  provider text not null default 'intasend',
  provider_ref text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz default now()
);

alter table payments enable row level security;

create policy "Users can view their own payments"
  on payments for select
  using (auth.uid() = user_id);

-- No insert policy for regular users — the initiate-payment Edge
-- Function creates the row (with service role) at the same time
-- it calls IntaSend, so the amount always matches the server-side
-- price table, never something the client could tamper with.

create index if not exists payments_provider_ref_idx on payments (provider_ref);
