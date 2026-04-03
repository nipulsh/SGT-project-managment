-- Run after 001. Adds peer visibility for faculty/students and blocks self role escalation.

create or replace function public.users_prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.users where id = auth.uid() and role = 'dean') then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Only the dean may change user roles';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_role on public.users;
create trigger trg_users_role
  before update on public.users
  for each row
  execute function public.users_prevent_role_escalation();

-- Faculty: self + students on assigned projects
drop policy if exists users_faculty_related on public.users;
create policy users_faculty_related on public.users
  for select using (
    public.current_role() = 'faculty'
    and (
      id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        join public.projects p on p.id = pm.project_id
        where p.faculty_id = auth.uid() and pm.user_id = users.id
      )
    )
  );

-- Students: self + teammates + assigned faculty
drop policy if exists users_student_related on public.users;
create policy users_student_related on public.users
  for select using (
    public.current_role() = 'student'
    and (
      id = auth.uid()
      or exists (
        select 1 from public.project_members pm1
        join public.project_members pm2 on pm1.project_id = pm2.project_id
        where pm1.user_id = auth.uid() and pm2.user_id = users.id
      )
      or exists (
        select 1 from public.projects p
        join public.project_members pm on pm.project_id = p.id
        where pm.user_id = auth.uid() and p.faculty_id is not null and p.faculty_id = users.id
      )
    )
  );
