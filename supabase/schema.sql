-- ============================================================
-- PataKeja — Supabase schema
-- Run this in the Supabase SQL editor for a new project
-- (Dashboard → SQL Editor → New query → paste → Run).
-- ============================================================

-- ---------- profiles ----------
-- One row per auth user, holding the contact details PataKeja
-- needs that Supabase Auth doesn't store itself (name, phone, role).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  role text not null check (role in ('Landlord', 'Agent', 'Caretaker', 'Hunter')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------- listings ----------
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  city text not null,
  estate text not null,
  size text not null check (size in ('Bedsitter', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4+ Bedroom')),
  price numeric not null default 0,
  deposit numeric not null default 0,
  contact_name text not null,
  role text not null check (role in ('Landlord', 'Agent', 'Caretaker')),
  phone text not null,
  verified boolean not null default false,
  no_fee boolean not null default true,
  amenities text[] not null default '{}',
  description text not null default '',
  cbd text,
  stage text,
  water_rating int,
  sec_rating int,
  photos text[] not null default '{}',
  created_at timestamptz default now()
);

alter table listings enable row level security;

create policy "Listings are viewable by everyone"
  on listings for select
  using (true);

create policy "Authenticated users can insert their own listings"
  on listings for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own listings"
  on listings for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their own listings"
  on listings for delete
  using (auth.uid() = owner_id);

-- ---------- favorites ----------
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, listing_id)
);

alter table favorites enable row level security;

create policy "Users can view their own favorites"
  on favorites for select
  using (auth.uid() = user_id);

create policy "Users can add their own favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on favorites for delete
  using (auth.uid() = user_id);

-- ---------- reports (optional but recommended) ----------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table reports enable row level security;

create policy "Anyone signed in can file a report"
  on reports for insert
  with check (true);

-- No select/update/delete policy on reports for regular users —
-- review them from the Supabase dashboard's Table Editor as an admin.

-- ============================================================
-- Storage: photo uploads
-- ============================================================
-- Run this after creating a bucket named "listing-photos" in
-- Dashboard → Storage → New bucket → mark it "Public".
-- These policies let anyone READ photos, but only the uploader's
-- own folder (named after their user id) can be written to.

create policy "Public read access to listing photos"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own photos"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
