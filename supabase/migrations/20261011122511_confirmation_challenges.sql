-- One-time, human-turn-bound confirmation challenges for consequential
-- Bà Mối actions. No message text or raw token is stored.
create table confirmation_challenges (
  nonce uuid primary key,
  member_id uuid not null references members (id) on delete cascade,
  topic_id bigint not null,
  action text not null check (char_length(action) between 1 and 64),
  resource text not null check (char_length(resource) <= 128),
  issued_post_id bigint not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_post_id bigint,
  check (expires_at > issued_at),
  check ((consumed_at is null) = (consumed_post_id is null))
);

create index confirmation_challenges_member_expiry_idx
  on confirmation_challenges (member_id, expires_at);

alter table confirmation_challenges enable row level security;
revoke all on table confirmation_challenges from anon, authenticated;
