-- Jiminee schema (PRD § 3 Data Model)
-- Core tables, indexes, and signup/org triggers.

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  workplace_brief jsonb not null default '{}',  -- {locations, systems, supplies, contacts, notes}
  brief_completed_at timestamptz,               -- gate: Tell Me How disabled until non-null
  baseline_tasks_per_week numeric,              -- gate metric 1 comparison constant
  created_at timestamptz not null default now()
);

-- Profile rows mirror auth.users (created by trigger on signup).
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(255) not null,
  phone varchar(32),                            -- E.164; SMS fallback target
  voice_mode varchar(20) not null default 'default'
    check (voice_mode in ('default','tough_love')),
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role varchar(20) not null check (role in ('manager','administrator','worker')),
  unique (org_id, user_id)
);

-- Schema supports many boards per org; MVP UI exposes one.
create table boards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name varchar(255) not null default 'Main Board',
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  board_id uuid not null references boards(id) on delete cascade,
  title varchar(500) not null,                  -- the one sentence; only required field
  description text,
  status varchar(20) not null default 'backlog'
    check (status in ('backlog','todo','doing','blocked','done')),
  priority varchar(10) not null default 'normal' check (priority in ('low','normal','high')),
  due_at timestamptz,
  estimated_minutes int,                        -- drives the idle window
  location varchar(255),
  created_by uuid not null references users(id),
  assignee_id uuid references users(id),
  claimed_at timestamptz,
  completed_at timestamptz,
  last_activity_at timestamptz,                 -- updated by ANY worker action; idle basis
  sort_order double precision not null default 0,
  created_at timestamptz not null default now()
);

create table task_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  step_number int not null,
  content text not null,
  checked_at timestamptz,
  checked_by uuid references users(id),
  generation_id uuid not null,                  -- groups one Tell Me How output; regen = new id
  unique (task_id, generation_id, step_number)
);

create table task_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  role varchar(10) not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Append-only audit log. Written only via the log_task_event RPC / server lib.
create table task_events (
  id bigint generated always as identity primary key,
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  actor_id uuid references users(id),           -- null = system (cron)
  event_type varchar(40) not null check (event_type in (
    'created','claimed','released','moved','step_checked','steps_generated',
    'chat_message','nudge_sent','nudge_confirmed','nudge_expired','flagged',
    'ruled','completed','correction_flagged','manager_chase')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  raised_by uuid not null references users(id),
  reason text not null,
  status varchar(20) not null default 'open'
    check (status in ('open','reassigned','upheld','dismissed')),
  ruled_by uuid references users(id),
  ruling_note text,
  ruled_at timestamptz,
  created_at timestamptz not null default now()
);

create table nudges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id),
  channel varchar(10) not null check (channel in ('push','sms')),
  status varchar(20) not null default 'sent'
    check (status in ('sent','confirmed','released','expired')),
  sent_at timestamptz not null default now(),
  responded_at timestamptz
);

-- Manager corrections when workers flag bad AI steps. Phase 4 retrieval corpus.
create table instruction_corrections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  generation_id uuid not null,
  flagged_by uuid not null references users(id),
  flag_note text,
  correction text,
  corrected_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Append-only: RLS defines no UPDATE/DELETE policies for this table.
create table consent_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id),
  disclosure_version varchar(20) not null,      -- e.g. 'v1-tier1'
  acknowledged_at timestamptz not null default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,                          -- {p256dh, auth}
  created_at timestamptz not null default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email varchar(255) not null,
  role varchar(20) not null check (role in ('manager','administrator','worker')),
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid not null references users(id),
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days'
);

-- Indexes (PRD § 3)
create index idx_tasks_board_status on tasks (board_id, status, sort_order);
create index idx_tasks_idle on tasks (status, last_activity_at) where status = 'doing';
create index idx_events_org_time on task_events (org_id, created_at desc);
create index idx_events_task on task_events (task_id, created_at);
create index idx_steps_task on task_steps (task_id, generation_id, step_number);
create index idx_messages_task on task_messages (task_id, created_at);
create index idx_memberships_user on memberships (user_id);
create index idx_nudges_task_status on nudges (task_id, status, sent_at);

-- Signup trigger: mirror auth.users into public.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Org-creation trigger: creator becomes administrator; org gets a default board.
create or replace function public.handle_new_org()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    insert into public.memberships (org_id, user_id, role)
    values (new.id, auth.uid(), 'administrator');
  end if;
  insert into public.boards (org_id, name) values (new.id, 'Main Board');
  return new;
end;
$$;

create trigger on_org_created
  after insert on organizations
  for each row execute function public.handle_new_org();
