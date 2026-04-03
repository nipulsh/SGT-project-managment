-- Extended project submission: lead academic info, team rows, external faculty,
-- rich project fields, budget request, extra storage bucket.

-- Safe creator membership when JWT has no uid (e.g. service role dev bypass).
create or replace function public.on_project_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    insert into public.project_members (project_id, user_id)
    values (new.id, auth.uid())
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

alter table public.projects
  add column if not exists lead_full_name text,
  add column if not exists lead_roll_number text,
  add column if not exists lead_course text,
  add column if not exists lead_semester text,
  add column if not exists progress_summary text,
  add column if not exists mvp_timeline text,
  add column if not exists funds_requested numeric(12, 2),
  add column if not exists ppt_storage_path text,
  add column if not exists budget_doc_storage_path text,
  add column if not exists project_image_paths text[] not null default '{}';

alter table public.payment_details
  add column if not exists paytm_qr_url text;

create table if not exists public.project_team_students (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  full_name text not null,
  roll_number text,
  course text,
  semester text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.project_external_faculty (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  full_name text not null,
  contribution text,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_team_students_project on public.project_team_students (project_id);
create index if not exists idx_project_external_faculty_project on public.project_external_faculty (project_id);

alter table public.project_team_students enable row level security;
alter table public.project_external_faculty enable row level security;

drop policy if exists project_team_students_select on public.project_team_students;
create policy project_team_students_select on public.project_team_students
  for select using (public.can_read_project(project_id));

drop policy if exists project_team_students_student_write on public.project_team_students;
create policy project_team_students_student_write on public.project_team_students
  for insert with check (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

drop policy if exists project_team_students_student_update on public.project_team_students;
create policy project_team_students_student_update on public.project_team_students
  for update using (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

drop policy if exists project_team_students_student_delete on public.project_team_students;
create policy project_team_students_student_delete on public.project_team_students
  for delete using (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

drop policy if exists project_external_faculty_select on public.project_external_faculty;
create policy project_external_faculty_select on public.project_external_faculty
  for select using (public.can_read_project(project_id));

drop policy if exists project_external_faculty_student_write on public.project_external_faculty;
create policy project_external_faculty_student_write on public.project_external_faculty
  for insert with check (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

drop policy if exists project_external_faculty_student_update on public.project_external_faculty;
create policy project_external_faculty_student_update on public.project_external_faculty
  for update using (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

drop policy if exists project_external_faculty_student_delete on public.project_external_faculty;
create policy project_external_faculty_student_delete on public.project_external_faculty
  for delete using (
    public.current_role() = 'student'
    and public.is_project_member(project_id, auth.uid())
  );

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists project_files_select on storage.objects;
create policy project_files_select on storage.objects
  for select using (
    bucket_id = 'project-files'
    and public.can_read_project((storage.foldername(name))[1]::uuid)
  );

drop policy if exists project_files_insert on storage.objects;
create policy project_files_insert on storage.objects
  for insert with check (
    bucket_id = 'project-files'
    and public.current_role() = 'student'
    and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

drop policy if exists project_files_update on storage.objects;
create policy project_files_update on storage.objects
  for update using (
    bucket_id = 'project-files'
    and public.current_role() = 'student'
    and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

drop policy if exists project_files_delete on storage.objects;
create policy project_files_delete on storage.objects
  for delete using (
    bucket_id = 'project-files'
    and public.current_role() = 'student'
    and public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid())
  );
