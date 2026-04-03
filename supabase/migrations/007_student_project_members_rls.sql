-- Students may insert their own project_members row (client upserts / idempotency).
-- The AFTER INSERT trigger also adds the creator; this policy allows explicit writes.

drop policy if exists pm_student_own_membership on public.project_members;
create policy pm_student_own_membership on public.project_members
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'student'
    )
  );

-- Project insert: same condition as readable self row (avoids edge cases with current_role()).
drop policy if exists projects_student_insert on public.projects;
create policy projects_student_insert on public.projects
  for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'student'
    )
  );
