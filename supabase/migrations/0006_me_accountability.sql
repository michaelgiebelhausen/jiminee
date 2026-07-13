-- Jiminee .me accountability layer (grill session 2026-07-12, spec § .me decision log)
-- Personal workspaces reuse the org machinery: a personal workspace IS an organization
-- with is_personal = true and exactly one member. Every existing RLS policy, mutation,
-- and the log_task_event RPC works unchanged.

-- ---------------------------------------------------------------------------
-- 1. Personal workspaces
-- ---------------------------------------------------------------------------
alter table organizations
  add column is_personal boolean not null default false,
  add column owner_id uuid references users(id);

-- One personal workspace per user.
create unique index idx_orgs_personal_owner
  on organizations(owner_id) where is_personal;

-- Idempotent creator: returns the caller's personal workspace, creating it on
-- first call. The on_org_created trigger supplies the membership + Main Board.
create or replace function public.create_personal_workspace()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  select id into v_org_id from organizations
    where is_personal and owner_id = auth.uid();
  if v_org_id is not null then
    return v_org_id;
  end if;
  insert into organizations (name, is_personal, owner_id, workplace_brief, brief_completed_at)
    values ('My Jiminee', true, auth.uid(), '{}', now())
    returning id into v_org_id;
  return v_org_id;
end;
$$;

grant execute on function public.create_personal_workspace() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Task taxonomy: one-off to-dos, project tasks, recurring habits.
--    committed_on = the daily-ritual "today pick" flag (the calendar substitute).
-- ---------------------------------------------------------------------------
alter table tasks
  add column task_type varchar(10) not null default 'todo'
    check (task_type in ('todo','project','habit')),
  add column recurrence varchar(10)
    check (recurrence in ('daily','weekdays')),
  add column committed_on date;

-- Habits must recur; non-habits must not.
alter table tasks add constraint tasks_habit_recurrence
  check ((task_type = 'habit') = (recurrence is not null));

create index idx_tasks_committed on tasks(org_id, committed_on)
  where committed_on is not null;

-- ---------------------------------------------------------------------------
-- 3. Habit completions (streaks are computed from this, one row per day).
-- ---------------------------------------------------------------------------
create table habit_completions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id),
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique(task_id, completed_on)
);

create index idx_habit_completions_task on habit_completions(task_id, completed_on desc);

-- ---------------------------------------------------------------------------
-- 4. Focus sessions: the self-declared "I'm on this now" window the screen
--    agent watches. outcome is null while the session is open.
-- ---------------------------------------------------------------------------
create table focus_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  outcome varchar(12)
    check (outcome in ('completed','stopped','abandoned')),
  away_seconds integer not null default 0,
  checkins_answered integer not null default 0,
  checkins_missed integer not null default 0
);

create index idx_focus_sessions_open on focus_sessions(user_id) where ended_at is null;
create index idx_focus_sessions_task on focus_sessions(task_id, started_at desc);

-- ---------------------------------------------------------------------------
-- 5. Self-directed nudge settings (.me): the intensity ladder is the paid
--    conscience — warm -> firm -> tough_love, plus quiet hours and channels.
-- ---------------------------------------------------------------------------
create table me_settings (
  user_id uuid primary key references users(id) on delete cascade,
  nudge_intensity varchar(12) not null default 'warm'
    check (nudge_intensity in ('warm','firm','tough_love')),
  quiet_start smallint not null default 22 check (quiet_start between 0 and 23),
  quiet_end smallint not null default 7 check (quiet_end between 0 and 23),
  sms_enabled boolean not null default false,
  ritual_hour smallint not null default 8 check (ritual_hour between 0 and 23),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. RLS + grants (new tables only; existing policies cover tasks/orgs).
-- ---------------------------------------------------------------------------
alter table habit_completions enable row level security;
alter table focus_sessions enable row level security;
alter table me_settings enable row level security;

create policy habit_completions_select on habit_completions for select
  using (org_id in (select user_org_ids()));
create policy habit_completions_insert on habit_completions for insert
  with check (user_id = auth.uid() and org_id in (select user_org_ids()));
create policy habit_completions_delete on habit_completions for delete
  using (user_id = auth.uid());

create policy focus_sessions_select on focus_sessions for select
  using (org_id in (select user_org_ids()));
create policy focus_sessions_insert on focus_sessions for insert
  with check (user_id = auth.uid() and org_id in (select user_org_ids()));
create policy focus_sessions_update on focus_sessions for update
  using (user_id = auth.uid());

create policy me_settings_all on me_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Newer Supabase no longer auto-grants Data API roles on new tables.
grant select, insert, update, delete on habit_completions, focus_sessions, me_settings to authenticated;
grant all on habit_completions, focus_sessions, me_settings to service_role;

-- ---------------------------------------------------------------------------
-- 7. New audit-log event vocabulary (mirror src/types/events.ts).
--    Both the CHECK constraint and the RPC whitelist gain the .me events.
-- ---------------------------------------------------------------------------
alter table task_events drop constraint task_events_event_type_check;
alter table task_events add constraint task_events_event_type_check
  check (event_type in (
    'created','claimed','released','moved','step_checked','steps_generated',
    'chat_message','nudge_sent','nudge_confirmed','nudge_expired','flagged',
    'ruled','completed','correction_flagged','manager_chase',
    'committed_today','focus_started','focus_ended','habit_completed'));

create or replace function public.log_task_event(
  p_org_id uuid,
  p_task_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'
)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_id bigint;
begin
  if not exists (select 1 from memberships where user_id = auth.uid() and org_id = p_org_id) then
    raise exception 'not a member of this organization';
  end if;
  if p_event_type not in (
    'created','claimed','released','moved','step_checked','steps_generated',
    'chat_message','nudge_sent','nudge_confirmed','nudge_expired','flagged',
    'ruled','completed','correction_flagged','manager_chase',
    'committed_today','focus_started','focus_ended','habit_completed') then
    raise exception 'invalid event type %', p_event_type;
  end if;
  insert into task_events (org_id, task_id, actor_id, event_type, payload)
  values (p_org_id, p_task_id, auth.uid(), p_event_type, coalesce(p_payload, '{}'))
  returning id into v_id;
  return v_id;
end;
$$;
