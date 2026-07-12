-- Dev-only seed (TASK-012): two orgs, three roles each, demo tasks.
-- Org B ("Other Org") exists solely for cross-tenant RLS testing.
-- Local password for every seeded user: password123

-- Seeded auth users (signup trigger mirrors them into public.users).
-- GoTrue requires token columns as '' (not NULL) and matching auth.identities rows for password login.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pat@jiminee.test',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Pat Supervisor"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reyes@jiminee.test',  crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Dr. Elena Reyes"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tyler@jiminee.test',  crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Tyler Worker"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@other.test',   crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Other Admin"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'worker@other.test',  crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Other Worker"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', u.id::text, now(), now(), now()
from auth.users u
where u.email like '%@jiminee.test' or u.email like '%@other.test';

-- Orgs (creation trigger adds a Main Board each; auth.uid() is null here so memberships are manual).
insert into organizations (id, name, workplace_brief, brief_completed_at, baseline_tasks_per_week) values
  ('10000000-0000-0000-0000-000000000001', 'Jiminee Dept',
   '{"locations":"Mail room: 3rd floor next to elevator. Supply closet: across from mail room. Printer: Brackett 214.","systems":"Copier code taped inside supply closet door. Scanner: front-desk Canon, use SCAN-TO-EMAIL preset.","supplies":"Toner on second shelf of supply closet, labeled by model.","contacts":"Facilities: ext 5501. IT helpdesk: ext 4357. Questions about mail: ask Pat.","notes":"Building doors lock at 6pm."}',
   now(), 8),
  ('10000000-0000-0000-0000-000000000002', 'Other Org', '{}', null, null);

insert into memberships (org_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'administrator'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'manager'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'worker'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'administrator'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'worker');

-- Demo tasks on Jiminee Dept's main board.
insert into tasks (org_id, board_id, title, status, priority, estimated_minutes, location, created_by, sort_order)
select o.org_id, b.id, t.title, t.status, t.priority, t.est, t.loc, '00000000-0000-0000-0000-000000000002', t.ord
from (values ('10000000-0000-0000-0000-000000000001'::uuid)) as o(org_id)
join boards b on b.org_id = o.org_id
cross join (values
  ('Update the bulletin board outside 301 for fall events', 'backlog', 'normal', 30, null, 1.0),
  ('Inventory the supply closet and list what''s low',      'backlog', 'normal', 45, null, 2.0),
  ('Scan and email the signed forms in my mailbox',         'todo',    'high',   20, null, 1.0),
  ('Restock the printer in Brackett 214',                   'todo',    'high',   15, 'Brackett 214', 2.0),
  ('Water the plants in the faculty lounge',                'todo',    'low',    10, 'Faculty lounge', 3.0)
) as t(title, status, priority, est, loc, ord);

-- Tyler has already acknowledged the Tier-1 disclosure (FR-013 board guard).
insert into consent_records (org_id, user_id, disclosure_version) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'v1-tier1');

-- One task in Other Org (cross-tenant test target).
insert into tasks (org_id, board_id, title, status, created_by, sort_order)
select '10000000-0000-0000-0000-000000000002', b.id, 'Other org secret task', 'todo', '00000000-0000-0000-0000-000000000011', 1.0
from boards b where b.org_id = '10000000-0000-0000-0000-000000000002';
