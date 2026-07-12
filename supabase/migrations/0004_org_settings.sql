-- Per-org operational settings (TASK-047, PRD § 14 Q1/Q2 defaults).
alter table organizations
  add column quiet_hours_start int not null default 8 check (quiet_hours_start between 0 and 23),
  add column quiet_hours_end int not null default 18 check (quiet_hours_end between 1 and 24),
  add column timezone text not null default 'America/New_York';
