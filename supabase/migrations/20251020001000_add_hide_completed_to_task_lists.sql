-- Add hide_completed flag to task_lists, defaulting to TRUE
begin;

alter table public.task_lists
  add column if not exists hide_completed boolean not null default true;

commit;


