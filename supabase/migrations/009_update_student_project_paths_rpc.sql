-- Update submission file paths on pending projects (bypasses RLS like create_student_project).

create or replace function public.update_student_project_submission_paths(
  p_project_id uuid,
  p_ppt_storage_path text,
  p_budget_doc_storage_path text,
  p_project_image_paths text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'student'
  ) then
    raise exception 'Only students may update projects';
  end if;

  if not public.is_project_member(p_project_id, auth.uid()) then
    raise exception 'Not a member of this project';
  end if;

  if not exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.status = 'pending'
  ) then
    raise exception 'Project is not editable';
  end if;

  update public.projects
  set
    ppt_storage_path = p_ppt_storage_path,
    budget_doc_storage_path = p_budget_doc_storage_path,
    project_image_paths = coalesce(p_project_image_paths, '{}')
  where id = p_project_id;
end;
$$;

revoke all on function public.update_student_project_submission_paths(uuid, text, text, text[]) from public;

grant execute on function public.update_student_project_submission_paths(uuid, text, text, text[]) to authenticated;
