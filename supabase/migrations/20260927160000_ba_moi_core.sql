-- Bà Mối core schema (spec v3, build plan W-B).
-- The service is the only client: RLS is on everywhere with NO anon or
-- authenticated policies, and the anon key is never shipped to any client.
-- Idempotency is semantic: unique constraints + INSERT ... ON CONFLICT.

create table members (
  id uuid primary key default gen_random_uuid(),
  discourse_user_id integer unique,                 -- null only for sample members
  discourse_username text,                         -- never exposed to other members
  display_name text,
  persona_topic_id integer,                         -- the member's DM thread with Bà Mối
  status text not null default 'active' check (status in ('active', 'paused')),  -- delete removes the rows
  consent_version text,
  opted_in_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_real_have_discourse check (is_sample or discourse_user_id is not null)
);

create table member_profiles (
  member_id uuid primary key references members (id) on delete cascade,
  intent text check (intent in ('friendship', 'casual', 'long_term', 'marriage')),
  gender text check (gender in ('female', 'male', 'other')),
  seeking text check (seeking in ('female', 'male', 'both')),
  birth_date date,
  birth_time text check (birth_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  city text,
  age_min int check (age_min >= 18),
  age_max int check (age_max <= 100),
  marital text check (marital in ('single', 'divorced', 'widowed', 'married')),
  children text check (children in ('none', 'yes_live_with', 'yes_not_live_with')),
  wants_children text check (wants_children in ('yes', 'no', 'unsure')),
  hobbies text[] not null default '{}',
  open_answer text,
  occupation text,
  -- derived by the service (lib/matching), recomputed on every update
  region text,
  lunar_year int,
  year_stem text,
  year_branch text,
  nap_am text,
  nap_am_element text,
  day_stem text,
  day_branch text,
  day_element text,
  updated_at timestamptz not null default now(),
  constraint member_profiles_age_range check (age_min is null or age_max is null or age_min <= age_max)
);

create table pool_cards (
  member_id uuid primary key references members (id) on delete cascade,
  card jsonb not null,
  summary_text text,
  confirmed_at timestamptz,
  discoverable boolean not null default false,
  updated_at timestamptz not null default now()
);

create table discoveries (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references members (id) on delete cascade,
  candidate_id uuid not null references members (id) on delete cascade,
  source text not null check (source in ('box', 'search')),
  a_to_b numeric(5, 1) not null,
  b_to_a numeric(5, 1) not null,
  mutual numeric(5, 1) not null,
  tier text not null check (tier in ('hop', 'rat_hop', 'hiem_co')),
  card_snapshot jsonb not null,
  fit jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'interest_sent', 'matched', 'void')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discoveries_pair_unique unique (viewer_id, candidate_id),
  constraint discoveries_not_self check (viewer_id <> candidate_id)
);
create index discoveries_candidate_idx on discoveries (candidate_id);
create index discoveries_viewer_created_idx on discoveries (viewer_id, created_at);

-- One box per member per Vietnam calendar day; open_day is computed by the
-- service as (now() at time zone 'Asia/Ho_Chi_Minh')::date.
create table daily_openings (
  member_id uuid not null references members (id) on delete cascade,
  open_day date not null,
  status text not null default 'pending' check (status in ('pending', 'matched', 'no_match', 'void')),
  discovery_id uuid references discoveries (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (member_id, open_day)
);

-- An interest is the sender's "yes"; its status is the recipient's answer.
-- A decline is final: the matching filters exclude declined pairs both ways.
-- Expiry (7 days) is applied lazily on read and enforced again on respond.
create table interests (
  id uuid primary key default gen_random_uuid(),
  discovery_id uuid not null references discoveries (id) on delete cascade,
  from_id uuid not null references members (id) on delete cascade,
  to_id uuid not null references members (id) on delete cascade,
  recipient_payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'dismissed', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint interests_pair_unique unique (from_id, to_id),
  constraint interests_not_self check (from_id <> to_id)
);
create index interests_to_status_idx on interests (to_id, status);
create index interests_from_created_idx on interests (from_id, created_at);

create table matches (
  id uuid primary key default gen_random_uuid(),
  member_a uuid not null references members (id) on delete cascade,
  member_b uuid not null references members (id) on delete cascade,
  state text not null default 'mutual_interest' check (state in ('mutual_interest', 'revealed', 'closed')),
  reveal_a boolean not null default false,
  reveal_b boolean not null default false,
  closed_reason text check (closed_reason in ('ended', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_canonical_order check (member_a < member_b),
  constraint matches_pair_unique unique (member_a, member_b)
);
create index matches_member_b_idx on matches (member_b);

-- Each member of a match gets a private-message thread with the relay bot.
create table relay_topics (
  match_id uuid not null references matches (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  discourse_topic_id integer unique,                -- null until the thread is created
  alias_for_other text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, member_id)
);

-- id doubles as the per-match display sequence.
create table relay_messages (
  id bigserial primary key,
  match_id uuid not null references matches (id) on delete cascade,
  from_member uuid not null references members (id) on delete cascade,
  source_post_id integer not null unique,
  relayed_post_id integer,
  status text not null check (status in ('relayed', 'held', 'rate_limited', 'too_long')),
  created_at timestamptz not null default now()
);
create index relay_messages_from_created_idx on relay_messages (from_member, created_at);

create table blocks (
  blocker_id uuid not null references members (id) on delete cascade,
  blocked_id uuid not null references members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

-- Discourse posts that failed to send; retried by pg_cron, dead after 10.
create table pending_posts (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  kind text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'dead')),
  attempts int not null default 0,
  next_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pending_posts_due_idx on pending_posts (status, next_at);

alter table members enable row level security;
alter table member_profiles enable row level security;
alter table pool_cards enable row level security;
alter table discoveries enable row level security;
alter table daily_openings enable row level security;
alter table interests enable row level security;
alter table matches enable row level security;
alter table relay_topics enable row level security;
alter table relay_messages enable row level security;
alter table blocks enable row level security;
alter table pending_posts enable row level security;
