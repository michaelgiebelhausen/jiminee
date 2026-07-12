-- Gate-metric views (FR-015, TASK-044). security_invoker so the querying
-- user's RLS applies to the underlying tables.

create view gate_metrics_weekly with (security_invoker = true) as
select
  org_id,
  date_trunc('week', created_at) as week,
  count(*) filter (where event_type = 'created') as tasks_created,
  count(distinct task_id) filter (where event_type = 'completed') as tasks_completed,
  count(distinct task_id) filter (where event_type = 'manager_chase') as tasks_chased,
  count(*) filter (where event_type = 'nudge_sent') as nudges_sent,
  count(*) filter (where event_type = 'nudge_confirmed') as nudges_confirmed
from task_events
group by 1, 2;

create view worker_activity with (security_invoker = true) as
select
  t.org_id,
  t.assignee_id as user_id,
  u.display_name,
  count(*) filter (where t.status = 'done') as completed,
  count(*) filter (where t.status = 'doing') as in_progress,
  avg(extract(epoch from (t.completed_at - t.claimed_at)) / 60)
    filter (where t.completed_at is not null and t.claimed_at is not null) as avg_minutes_to_done
from tasks t
join users u on u.id = t.assignee_id
where t.assignee_id is not null
group by 1, 2, 3;

grant select on gate_metrics_weekly, worker_activity to authenticated, service_role;
