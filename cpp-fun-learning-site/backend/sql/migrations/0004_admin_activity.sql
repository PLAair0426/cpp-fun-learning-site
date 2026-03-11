create table if not exists admin_activity_logs (
  id bigserial primary key,
  actor_id text not null,
  actor_name text not null,
  actor_email text not null,
  action text not null,
  target_type text not null,
  target_key text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_logs_created_at
  on admin_activity_logs(created_at desc);
