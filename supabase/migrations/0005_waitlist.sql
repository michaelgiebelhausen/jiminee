-- .me waitlist (FR-018; vision assumption 8: the .work story generates .me demand).
create table me_waitlist (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null unique,
  created_at timestamptz not null default now()
);
alter table me_waitlist enable row level security;
-- No client policies: inserts happen through the API route via service role only.
grant all on me_waitlist to service_role;
