-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create giveaway entries table
create table if not exists public.giveaway_entries (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  instagram    text not null,
  email        text not null,
  phone        text,
  video_url    text,
  submitted_at timestamptz default now()
);

-- 2. Allow anyone to insert (public giveaway)
alter table public.giveaway_entries enable row level security;

create policy "Anyone can submit a giveaway entry"
  on public.giveaway_entries for insert
  with check (true);

-- 3. Only admins can read entries (change to your user id or role)
create policy "Only service role can read entries"
  on public.giveaway_entries for select
  using (false); -- update this to your admin check if needed
