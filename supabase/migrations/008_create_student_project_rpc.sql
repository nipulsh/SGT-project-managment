-- Inserts a project as the authenticated student, bypassing RLS on `projects` while
-- still enforcing role inside the function (avoids policy drift / remote migration gaps).

create or replace function public.create_student_project(
  p_title text,
  p_description text default null,
  p_domain text default null,
  p_lead_full_name text default null,
  p_lead_roll_number text default null,
  p_lead_course text default null,
  p_lead_semester text default null,
  p_progress_summary text default null,
  p_mvp_timeline text default null,
  p_funds_requested numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role text;
  pid uuid;
  t text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  select u.role into v_role from public.users u where u.id = v_uid;
  if v_role is distinct from 'student' then
    raise exception 'Only students may create projects';
  end if;

  t := trim(p_title);
  if t = '' then
    raise exception 'Project title is required';
  end if;

  insert into public.projects (
    title,
    description,
    domain,
    status,
    lead_full_name,
    lead_roll_number,
    lead_course,
    lead_semester,
    progress_summary,
    mvp_timeline,
    funds_requested
  )
  values (
    t,
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_domain, '')), ''),
    'pending',
    nullif(trim(coalesce(p_lead_full_name, '')), ''),
    nullif(trim(coalesce(p_lead_roll_number, '')), ''),
    nullif(trim(coalesce(p_lead_course, '')), ''),
    nullif(trim(coalesce(p_lead_semester, '')), ''),
    nullif(trim(coalesce(p_progress_summary, '')), ''),
    nullif(trim(coalesce(p_mvp_timeline, '')), ''),
    p_funds_requested
  )
  returning id into pid;

  return pid;
end;
$$;

revoke all on function public.create_student_project(
  text, text, text, text, text, text, text, text, text, numeric
) from public;

grant execute on function public.create_student_project(
  text, text, text, text, text, text, text, text, text, numeric
) to authenticated;
