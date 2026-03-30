-- RallyQ Database Schema for Supabase

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Players table
create table players (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  games_played integer default 0,
  wins integer default 0,
  losses integer default 0,
  points integer default 0,
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  created_at bigint not null,
  fee_paid numeric default 0,
  fee_owed numeric default 0,
  win_streak integer default 0,
  last_played bigint,
  achievements text[] default '{}',
  account_id uuid,
  updated_at timestamp with time zone default now()
);

-- Courts table
create table courts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  status text default 'available' check (status in ('available', 'playing', 'waiting')),
  players text[] default '{}',
  match_type text default 'doubles' check (match_type in ('singles', 'doubles')),
  session_fee_applied boolean default false,
  updated_at timestamp with time zone default now()
);

-- Matches table
create table matches (
  id uuid primary key default uuid_generate_v4(),
  court_id uuid references courts(id) on delete cascade,
  players text[] not null,
  match_type text not null check (match_type in ('singles', 'doubles')),
  winner text[],
  started_at bigint not null,
  ended_at bigint,
  session_id uuid,
  created_at timestamp with time zone default now()
);

-- Settings table
create table settings (
  id text primary key default 'default',
  match_type_default text default 'doubles' check (match_type_default in ('singles', 'doubles')),
  number_of_courts integer default 3,
  singles_shuttle_fee numeric default 60,
  doubles_shuttle_fee numeric default 30,
  court_fee_per_player numeric default 120,
  include_shuttle_fee boolean default true,
  currency text default '₱',
  updated_at timestamp with time zone default now()
);

-- Queue table
create table queue (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null,
  added_at bigint not null,
  created_at timestamp with time zone default now()
);

-- Accounts table
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  pin text,
  player_id uuid,
  role text default 'player' check (role in ('admin', 'player')),
  created_at bigint not null,
  updated_at timestamp with time zone default now()
);

-- Sessions table
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  join_code text unique not null,
  name text not null,
  status text default 'active' check (status in ('active', 'closed')),
  created_at bigint not null,
  closed_at bigint,
  player_ids text[] default '{}',
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index players_status_idx on players(status);
create index players_account_id_idx on players(account_id);
create index matches_court_id_idx on matches(court_id);
create index matches_session_id_idx on matches(session_id);
create index queue_added_at_idx on queue(added_at);
create index accounts_name_idx on accounts(name);
create index sessions_join_code_idx on sessions(join_code);
create index sessions_status_idx on sessions(status);

-- Insert default settings
insert into settings (id) values ('default') on conflict do nothing;

-- Insert default admin account
insert into accounts (id, name, pin, player_id, role, created_at)
values ('00000000-0000-0000-0000-000000000001', 'Admin', null, null, 'admin', extract(epoch from now()) * 1000)
on conflict do nothing;

-- Enable Row Level Security (RLS)
alter table players enable row level security;
alter table courts enable row level security;
alter table matches enable row level security;
alter table settings enable row level security;
alter table queue enable row level security;
alter table accounts enable row level security;
alter table sessions enable row level security;

-- RLS Policies (allow all for now - you can restrict later)
create policy "Allow all on players" on players for all using (true);
create policy "Allow all on courts" on courts for all using (true);
create policy "Allow all on matches" on matches for all using (true);
create policy "Allow all on settings" on settings for all using (true);
create policy "Allow all on queue" on queue for all using (true);
create policy "Allow all on accounts" on accounts for all using (true);
create policy "Allow all on sessions" on sessions for all using (true);
