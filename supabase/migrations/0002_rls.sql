-- Jiminee RLS policies + log_task_event RPC (PRD § Security Considerations, FR-001/FR-002/FR-005)
-- Tenancy rule: every row is org-scoped via memberships; write policies add role checks.
-- The service-role client bypasses RLS and is used only in cron/notification/server routes.

-- Helper: orgs the current user belongs to (security definer avoids RLS recursion on memberships).
create or replace function public.user_org_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$ select org_id from memberships where user_id = auth.uid() $$;

-- Helper: the current user's role in a given org ('' if none).
create or replace function public.user_role_in_org(p_org uuid)
returns text
language sql stable security definer set search_path = public
as $$ select coalesce((select role from memberships where user_id = auth.uid() and org_id = p_org), '') $$;

alter table organizations enable row level security;
alter table users enable row level security;
alter table memberships enable row level security;
alter table boards enable row level security;
alter table tasks enable row level security;
alter table task_steps enable row level security;
alter table task_messages enable row level security;
alter table task_events enable row level security;
alter table disputes enable row level security;
alter table nudges enable row level security;
alter table instruction_corrections enable row level security;
alter table consent_records enable row level security;
alter table push_subscriptions enable row level security;
alter table invites enable row level security;

-- organizations: members read; any authed user may create one (becomes admin via trigger); admins update.
create policy org_select on organizations for select using (id in (select user_org_ids()));
create policy org_insert on organizations for insert with check (auth.uid() is not null);
create policy org_update on organizations for update
  using (user_role_in_org(id) = 'administrator')
  with check (user_role_in_org(id) = 'administrator');

-- users: see yourself and anyone you share an org with; update only yourself.
create policy users_select on users for select using (
  id = auth.uid()
  or id in (select m.user_id from memberships m where m.org_id in (select user_org_ids()))
);
create policy users_update on users for update using (id = auth.uid()) with check (id = auth.uid());

-- memberships: read within your orgs (or your own rows). Writes happen via triggers/service role only.
create policy memberships_select on memberships for select using (
  user_id = auth.uid() or org_id in (select user_org_ids())
);

-- boards: members read; admins create.
create policy boards_select on boards for select using (org_id in (select user_org_ids()));
create policy boards_insert on boards for insert
  with check (user_role_in_org(org_id) = 'administrator');

-- tasks: members read. Managers/admins create and edit anything.
-- Workers may update only unclaimed tasks (to claim) or their own tasks (checkoffs/complete/release).
create policy tasks_select on tasks for select using (org_id in (select user_org_ids()));
create policy tasks_insert on tasks for insert
  with check (user_role_in_org(org_id) in ('manager','administrator') and created_by = auth.uid());
create policy tasks_update_mgr on tasks for update
  using (user_role_in_org(org_id) in ('manager','administrator'))
  with check (user_role_in_org(org_id) in ('manager','administrator'));
create policy tasks_update_worker on tasks for update
  using (
    user_role_in_org(org_id) = 'worker'
    and (assignee_id is null or assignee_id = auth.uid())
  )
  with check (
    user_role_in_org(org_id) = 'worker'
    and (assignee_id is null or assignee_id = auth.uid())
  );
create policy tasks_delete_admin on tasks for delete
  using (user_role_in_org(org_id) = 'administrator');

-- task_steps: members read; only the task's assignee updates (checkoffs). Inserts are server-side.
create policy steps_select on task_steps for select using (org_id in (select user_org_ids()));
create policy steps_update_assignee on task_steps for update
  using (exists (select 1 from tasks t where t.id = task_id and t.assignee_id = auth.uid()))
  with check (exists (select 1 from tasks t where t.id = task_id and t.assignee_id = auth.uid()));

-- task_messages: members read. Inserts are server-side (AI route persists both sides).
create policy msgs_select on task_messages for select using (org_id in (select user_org_ids()));

-- task_events: members read. NO insert policy — writes only via the RPC below or service role.
create policy events_select on task_events for select using (org_id in (select user_org_ids()));

-- disputes: members read; workers raise their own; rulings are server-side (admin-verified route).
create policy disputes_select on disputes for select using (org_id in (select user_org_ids()));
create policy disputes_insert on disputes for insert
  with check (org_id in (select user_org_ids()) and raised_by = auth.uid()
              and length(reason) >= 10);

-- nudges: the target reads their own; managers/admins read org nudges. Writes are server-side.
create policy nudges_select on nudges for select using (
  user_id = auth.uid() or user_role_in_org(org_id) in ('manager','administrator')
);

-- instruction_corrections: flagger + managers/admins read; writes are server-side.
create policy corrections_select on instruction_corrections for select using (
  flagged_by = auth.uid() or user_role_in_org(org_id) in ('manager','administrator')
);

-- consent_records: append-only. Insert your own; read your own or (admin) your org's. No update/delete.
create policy consent_insert on consent_records for insert
  with check (user_id = auth.uid() and org_id in (select user_org_ids()));
create policy consent_select on consent_records for select using (
  user_id = auth.uid() or user_role_in_org(org_id) = 'administrator'
);

-- push_subscriptions: own rows only.
create policy push_all on push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- invites: admins manage; acceptance is server-side (token-validated).
create policy invites_select on invites for select
  using (user_role_in_org(org_id) = 'administrator');
create policy invites_insert on invites for insert
  with check (user_role_in_org(org_id) = 'administrator' and invited_by = auth.uid());

-- log_task_event RPC: the ONLY client path into task_events (FR-005).
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
    'ruled','completed','correction_flagged','manager_chase') then
    raise exception 'invalid event type %', p_event_type;
  end if;
  insert into task_events (org_id, task_id, actor_id, event_type, payload)
  values (p_org_id, p_task_id, auth.uid(), p_event_type, coalesce(p_payload, '{}'))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.log_task_event(uuid, uuid, text, jsonb) to authenticated;

-- Newer Supabase no longer auto-grants Data API roles on new tables — grant explicitly.
-- RLS remains the authorization layer; these grants only make the tables reachable.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
-- task_events stays effectively append-only: RLS defines no INSERT/UPDATE/DELETE policy,
-- so the grant above cannot be exercised except through the security-definer RPC.

-- Realtime: live board sync on tasks, steps, disputes (respects RLS).
alter publication supabase_realtime add table tasks, task_steps, disputes;
