-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create giveaway entries table with phone and tshirt_size as mandatory fields
create table if not exists public.giveaway_entries (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  instagram    text not null,
  email        text not null,
  phone        text not null,
  tshirt_size  text not null,
  video_url    text not null,
  submitted_at timestamptz default now()
);

-- Note: If you already ran the previous script, run these ALTER statements to update the schema:
-- ALTER TABLE public.giveaway_entries ADD COLUMN IF NOT EXISTS tshirt_size text not null;
-- ALTER TABLE public.giveaway_entries ALTER COLUMN phone SET NOT NULL;
-- ALTER TABLE public.giveaway_entries ALTER COLUMN video_url SET NOT NULL;

-- 2. Allow anyone to insert (public giveaway)
alter table public.giveaway_entries enable row level security;

-- Drop existing policies if needed to avoid conflicts
drop policy if exists "Anyone can submit a giveaway entry" on public.giveaway_entries;
drop policy if exists "Only service role can read entries" on public.giveaway_entries;

create policy "Anyone can submit a giveaway entry"
  on public.giveaway_entries for insert
  with check (true);

-- 3. Only admins can read entries (change to your user id or role)
create policy "Only service role can read entries"
  on public.giveaway_entries for select
  using (false); -- update this to your admin check if needed
