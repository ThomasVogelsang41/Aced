-- ACED Supabase Migration 001 — Initial Schema
-- Run this in your Supabase project's SQL editor or via supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  avatar_url  text,
  handicap    numeric(4,1),
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced', 'pro')) default 'beginner',
  units       text check (units in ('ft', 'm')) default 'ft',
  created_at  timestamptz default now() not null
);

-- Create profile automatically on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- BAGS
-- ============================================================
create table if not exists public.bags (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null default 'My Bag',
  is_default  boolean not null default false,
  created_at  timestamptz default now() not null
);

-- Only one default bag per user
create unique index if not exists bags_user_default_idx
  on public.bags(user_id) where is_default = true;

alter table public.bags enable row level security;
create policy "Users can manage own bags"
  on public.bags for all using (auth.uid() = user_id);

-- ============================================================
-- BAG DISCS
-- ============================================================
create table if not exists public.bag_discs (
  id               uuid primary key default uuid_generate_v4(),
  bag_id           uuid not null references public.bags(id) on delete cascade,
  trydiscs_brand   text not null,
  trydiscs_disc    text not null,
  -- Cached flight numbers (from TryDiscs at time of add)
  category         text not null,
  speed            numeric(3,1) not null,
  glide            numeric(3,1) not null,
  turn             numeric(3,1) not null,
  fade             numeric(3,1) not null,
  -- User customizations
  nickname         text,
  plastic          text,
  weight           numeric(4,1),
  color            text,
  is_worn          boolean not null default false,
  added_at         timestamptz default now() not null
);

alter table public.bag_discs enable row level security;
create policy "Users can manage own bag discs"
  on public.bag_discs for all
  using (
    auth.uid() = (select user_id from public.bags where id = bag_id)
  );

-- ============================================================
-- COURSES (ACED-maintained GPS supplement to DiscGolfAPI)
-- ============================================================
create table if not exists public.courses (
  id               uuid primary key default uuid_generate_v4(),
  discgolfapi_id   text unique not null,
  name             text not null,
  latitude         numeric(10,7) not null,
  longitude        numeric(10,7) not null,
  hole_count       int not null,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

-- Public read access (course GPS data is not user-specific)
alter table public.courses enable row level security;
create policy "Anyone can view courses"
  on public.courses for select using (true);

-- Only service role can insert/update (for admin)
create policy "Service role can manage courses"
  on public.courses for all using (auth.role() = 'service_role');

-- ============================================================
-- COURSE LAYOUTS
-- ============================================================
create table if not exists public.course_layouts (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  name         text not null,  -- "Blue Tees", "White Tees", "Pro"
  par_total    int,
  created_at   timestamptz default now() not null
);

alter table public.course_layouts enable row level security;
create policy "Anyone can view layouts"
  on public.course_layouts for select using (true);
create policy "Service role can manage layouts"
  on public.course_layouts for all using (auth.role() = 'service_role');

-- ============================================================
-- HOLES
-- ============================================================
create table if not exists public.holes (
  id               uuid primary key default uuid_generate_v4(),
  layout_id        uuid not null references public.course_layouts(id) on delete cascade,
  hole_number      int not null,
  par              int not null default 3,
  distance_ft      int,              -- White/standard tee distance
  distance_pro_ft  int,              -- Pro/long tee distance
  tee_lat          numeric(10,7),
  tee_lng          numeric(10,7),
  basket_lat       numeric(10,7),
  basket_lng       numeric(10,7),
  notes            text,
  created_at       timestamptz default now() not null,
  unique (layout_id, hole_number)
);

alter table public.holes enable row level security;
create policy "Anyone can view holes"
  on public.holes for select using (true);
create policy "Service role can manage holes"
  on public.holes for all using (auth.role() = 'service_role');

-- ============================================================
-- ROUNDS
-- ============================================================
create table if not exists public.rounds (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  course_id        text not null,             -- DiscGolfAPI course ID
  course_name      text not null,
  layout_id        uuid references public.course_layouts(id),
  layout_name      text,
  started_at       timestamptz default now() not null,
  finished_at      timestamptz,
  total_score      int,
  total_par        int,
  weather_snapshot jsonb,                     -- Open-Meteo snapshot at round start
  bag_id           uuid references public.bags(id)
);

alter table public.rounds enable row level security;
create policy "Users can view own rounds"
  on public.rounds for select using (auth.uid() = user_id);
create policy "Users can insert own rounds"
  on public.rounds for insert with check (auth.uid() = user_id);
create policy "Users can update own rounds"
  on public.rounds for update using (auth.uid() = user_id);
create policy "Users can delete own rounds"
  on public.rounds for delete using (auth.uid() = user_id);

-- ============================================================
-- SCORES (individual hole scores within a round)
-- ============================================================
create table if not exists public.scores (
  id           uuid primary key default uuid_generate_v4(),
  round_id     uuid not null references public.rounds(id) on delete cascade,
  hole_number  int not null,
  par          int not null,
  strokes      int not null,
  disc_used    text,
  notes        text,
  unique (round_id, hole_number)
);

alter table public.scores enable row level security;
create policy "Users can manage own scores"
  on public.scores for all
  using (
    auth.uid() = (select user_id from public.rounds where id = round_id)
  );

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists rounds_user_id_idx on public.rounds(user_id);
create index if not exists rounds_started_at_idx on public.rounds(started_at desc);
create index if not exists scores_round_id_idx on public.scores(round_id);
create index if not exists bag_discs_bag_id_idx on public.bag_discs(bag_id);
create index if not exists bags_user_id_idx on public.bags(user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
