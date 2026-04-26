create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  salary numeric not null check (salary > 0),
  location text not null,
  type text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.saved_jobs (
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, job_id)
);

create index if not exists jobs_created_at_idx on public.jobs (created_at desc);
create index if not exists jobs_title_idx on public.jobs (title);
create index if not exists saved_jobs_job_id_idx on public.saved_jobs (job_id);

alter table public.jobs enable row level security;
alter table public.saved_jobs enable row level security;

create policy "Authenticated users can read jobs"
on public.jobs
for select
to authenticated
using (true);

create policy "Authenticated users can insert jobs"
on public.jobs
for insert
to authenticated
with check (true);

create policy "Authenticated users can update jobs"
on public.jobs
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete jobs"
on public.jobs
for delete
to authenticated
using (true);

create policy "Users can read their saved jobs"
on public.saved_jobs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can save jobs for themselves"
on public.saved_jobs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove their saved jobs"
on public.saved_jobs
for delete
to authenticated
using (auth.uid() = user_id);
