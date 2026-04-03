-- University Project Management — run in Supabase SQL Editor (or supabase db push)
-- Creates tables, RLS, storage buckets, and signup trigger.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null check (role in ('student', 'faculty', 'dean')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  domain text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  faculty_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  unique (project_id, user_id)
);

create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  amount numeric(12, 2) not null,
  description text,
  bill_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_details (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  account_number text not null,
  ifsc text not null,
  holder_name text not null,
  qr_code_url text
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  approved_amount numeric(12, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  receipt_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_faculty on public.projects (faculty_id);
create index if not exists idx_project_members_user on public.project_members (user_id);
create index if not exists idx_project_members_project on public.project_members (project_id);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer for RLS)
-- ---------------------------------------------------------------------------

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_project_member(p_project_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id and pm.user_id = p_user_id
  );
$$;

create or replace function public.can_read_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_role() = 'dean'
    or exists (
      select 1 from public.projects pr
      where pr.id = p_project_id and pr.faculty_id = auth.uid() and public.current_role() = 'faculty'
    )
    or public.is_project_member(p_project_id, auth.uid());
$$;

-- Auto-add creator as member
create or replace function public.on_project_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id)
  values (new.id, auth.uid())
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_projects_creator_member on public.projects;
create trigger trg_projects_creator_member
  after insert on public.projects
  for each row
  execute function public.on_project_created();

-- Profile from auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
  n text;
begin
  r := coalesce(new.raw_user_meta_data->>'role', 'student');
  if r not in ('student', 'faculty', 'dean') then
    r := 'student';
  end if;
  n := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  insert into public.users (id, name, role)
  values (new.id, n, r);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.progress_updates enable row level security;
alter table public.expenses enable row level security;
alter table public.payment_details enable row level security;
alter table public.payments enable row level security;

-- users
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (id = auth.uid() or public.current_role() = 'dean');

drop policy if exists users_dean_all on public.users;
create policy users_dean_all on public.users
  for all using (public.current_role() = 'dean');

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (id = auth.uid());

-- projects
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select using (public.can_read_project(id));

drop policy if exists projects_student_insert on public.projects;
create policy projects_student_insert on public.projects
  for insert
  with check (public.current_role() = 'student');

drop policy if exists projects_student_update_pending on public.projects;
create policy projects_student_update_pending on public.projects
  for update
  using (
    public.current_role() = 'student'
    and public.is_project_member(id, auth.uid())
    and status = 'pending'
  );

drop policy if exists projects_dean_update on public.projects;
create policy projects_dean_update on public.projects
  for update using (public.current_role() = 'dean');

-- project_members
drop policy if exists pm_select on public.project_members;
create policy pm_select on public.project_members
  for select using (public.can_read_project(project_id));

drop policy if exists pm_dean_write on public.project_members;
create policy pm_dean_write on public.project_members
  for all using (public.current_role() = 'dean');

drop policy if exists pm_student_no_write on public.project_members;
-- Students don't insert members directly; trigger handles creator. Dean manages others.

-- progress_updates
drop policy if exists pu_select on public.progress_updates;
create policy pu_select on public.progress_updates
  for select using (public.can_read_project(project_id));

drop policy if exists pu_student_insert on public.progress_updates;
create policy pu_student_insert on public.progress_updates
  for insert
  with check (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

-- expenses
drop policy if exists ex_select on public.expenses;
create policy ex_select on public.expenses
  for select using (public.can_read_project(project_id));

drop policy if exists ex_student_write on public.expenses;
create policy ex_student_write on public.expenses
  for insert
  with check (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

drop policy if exists ex_student_update on public.expenses;
create policy ex_student_update on public.expenses
  for update using (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

drop policy if exists ex_student_delete on public.expenses;
create policy ex_student_delete on public.expenses
  for delete using (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

-- payment_details
drop policy if exists pd_select on public.payment_details;
create policy pd_select on public.payment_details
  for select using (public.can_read_project(project_id));

drop policy if exists pd_student_write on public.payment_details;
create policy pd_student_write on public.payment_details
  for insert
  with check (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

drop policy if exists pd_student_update on public.payment_details;
create policy pd_student_update on public.payment_details
  for update using (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

-- payments
drop policy if exists pay_select on public.payments;
create policy pay_select on public.payments
  for select using (public.can_read_project(project_id));

drop policy if exists pay_dean_write on public.payments;
create policy pay_dean_write on public.payments
  for insert
  with check (public.current_role() = 'dean');

drop policy if exists pay_dean_update on public.payments;
create policy pay_dean_update on public.payments
  for update using (public.current_role() = 'dean');

-- ---------------------------------------------------------------------------
-- Storage buckets (private)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('bills', 'bills', false),
  ('qr-codes', 'qr-codes', false),
  ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Path convention: {project_id}/{filename}

drop policy if exists bills_select on storage.objects;
create policy bills_select on storage.objects
  for select using (
    bucket_id = 'bills'
    and public.can_read_project((storage.foldername(name))[1]::uuid)
  );

drop policy if exists bills_insert on storage.objects;
create policy bills_insert on storage.objects
  for insert
  with check (
    bucket_id = 'bills'
    and public.current_role() = 'student'
    and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

drop policy if exists qr_select on storage.objects;
create policy qr_select on storage.objects
  for select using (
    bucket_id = 'qr-codes'
    and public.can_read_project((storage.foldername(name))[1]::uuid)
  );

drop policy if exists qr_insert on storage.objects;
create policy qr_insert on storage.objects
  for insert
  with check (
    bucket_id = 'qr-codes'
    and public.current_role() = 'student'
    and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

drop policy if exists qr_update on storage.objects;
create policy qr_update on storage.objects
  for update using (
    bucket_id = 'qr-codes'
    and public.current_role() = 'student'
    and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

drop policy if exists receipts_select on storage.objects;
create policy receipts_select on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (
      public.current_role() = 'dean'
      or public.can_read_project((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists receipts_insert on storage.objects;
create policy receipts_insert on storage.objects
  for insert
  with check (
    bucket_id = 'receipts'
    and public.current_role() = 'dean'
  );

drop policy if exists receipts_update on storage.objects;
create policy receipts_update on storage.objects
  for update using (
    bucket_id = 'receipts'
    and public.current_role() = 'dean'
  );
