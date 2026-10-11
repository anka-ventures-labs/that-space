-- Rolling pre-reveal relay context. The service uses only a short tail of
-- already-relayed text to catch contact details split across messages.
create table relay_contact_windows (
  match_id uuid not null references matches (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  text_tail text not null check (char_length(text_tail) <= 512),
  updated_at timestamptz not null default now(),
  primary key (match_id, member_id)
);

alter table relay_contact_windows enable row level security;
revoke all on table relay_contact_windows from anon, authenticated;
