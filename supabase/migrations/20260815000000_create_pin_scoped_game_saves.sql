create table if not exists public.access_pins (
  id uuid primary key default gen_random_uuid(),
  pin_hash text not null unique check (pin_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  access_pin_id uuid not null references public.access_pins(id) on delete cascade,
  file_name text not null check (char_length(btrim(file_name)) between 1 and 24),
  file_name_normalized text generated always as (lower(btrim(file_name))) stored,
  player_name text not null check (char_length(btrim(player_name)) between 1 and 20),
  stars integer not null default 0 check (stars >= 0),
  progress jsonb not null default '{}'::jsonb check (jsonb_typeof(progress) = 'object'),
  lang text not null default 'en' check (lang in ('en', 'ms')),
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_saves_unique_file_per_pin unique (access_pin_id, file_name_normalized)
);

create index if not exists game_saves_access_pin_updated_idx
  on public.game_saves (access_pin_id, updated_at desc);

alter table public.access_pins enable row level security;
alter table public.game_saves enable row level security;

revoke all on table public.access_pins from anon, authenticated;
revoke all on table public.game_saves from anon, authenticated;

insert into public.access_pins (pin_hash)
values
  ('5ef23d80f400e4575d6f2b5cdafcdc53b063dd7936149328fd186b0bd080648b'),
  ('4b5bda09e8c24035af7e08415645266a4bf976ff743434e175ae2894219ff08b'),
  ('ea220edc806115ae5c8a81d93ebcc4084bd189228662481ea4cf1b89f8031d8b'),
  ('408d57bb25b3d4787701714a2d69983cfdc22cbb50ef684489454ee585ed338c'),
  ('b4b840c837023f0b4084184a951695df5cf9af802d0e5f0c7437def95e147d03'),
  ('bfcef0baa2b5975b5cb9b0fdad4b1a6addc49c11c621447361469a6236000175')
on conflict (pin_hash) do nothing;
