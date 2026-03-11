alter table users add column if not exists role text not null default 'learner';
alter table users add column if not exists is_active boolean not null default true;
