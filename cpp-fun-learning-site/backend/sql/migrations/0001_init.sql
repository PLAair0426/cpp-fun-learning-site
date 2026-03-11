create table if not exists learning_paths (
  slug text primary key,
  title text not null,
  theme text not null,
  estimated_hours integer not null default 0,
  lesson_count integer not null default 0,
  challenge_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists content_documents (
  doc_key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists lessons (
  id text primary key,
  path_slug text references learning_paths(slug),
  title text not null,
  module text not null,
  duration text not null,
  difficulty text not null,
  objective text not null,
  tags jsonb not null default '[]'::jsonb,
  snippet text not null default ''
);

create table if not exists problems (
  slug text primary key,
  title text not null,
  difficulty text not null,
  problem_type text not null,
  mission text not null,
  tags jsonb not null default '[]'::jsonb,
  description text not null,
  starter_code text not null,
  runtime text not null default 'judge0'
);

create table if not exists submissions (
  id text primary key,
  problem_slug text not null references problems(slug),
  user_id text,
  submit_type text not null,
  language text not null,
  status text not null,
  result text not null default '',
  judge0_token text,
  source_code text not null,
  stdin text not null default '',
  stdout text not null default '',
  compile_output text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists user_progress (
  id bigserial primary key,
  user_id text not null,
  path_slug text not null references learning_paths(slug),
  lesson_id text references lessons(id),
  progress_percent integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists xp_snapshots (
  id bigserial primary key,
  user_id text not null,
  xp integer not null default 0,
  streak integer not null default 0,
  created_at timestamptz not null default now()
);
