-- Inserts team rows, external faculty, and payment details for a pending project owned by the caller.

create or replace function public.finalize_student_project_submission(
  p_project_id uuid,
  p_team jsonb,
  p_faculty jsonb,
  p_account_number text,
  p_ifsc text,
  p_holder_name text,
  p_qr_bank text,
  p_qr_paytm text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i int;
  n int;
  elem jsonb;
  fn text;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'student'
  ) then
    raise exception 'Only students may submit';
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

  if trim(coalesce(p_account_number, '')) = ''
     or trim(coalesce(p_ifsc, '')) = ''
     or trim(coalesce(p_holder_name, '')) = '' then
    raise exception 'Bank account details are required';
  end if;

  if p_team is null or jsonb_typeof(p_team) <> 'array' then
    p_team := '[]'::jsonb;
  end if;
  if p_faculty is null or jsonb_typeof(p_faculty) <> 'array' then
    p_faculty := '[]'::jsonb;
  end if;

  delete from public.project_team_students where project_id = p_project_id;
  delete from public.project_external_faculty where project_id = p_project_id;

  n := jsonb_array_length(p_team);
  for i in 0 .. n - 1 loop
    elem := p_team->i;
    fn := trim(coalesce(elem->>'full_name', ''));
    if fn = '' then
      continue;
    end if;
    insert into public.project_team_students (
      project_id, full_name, roll_number, course, semester, sort_order
    )
    values (
      p_project_id,
      fn,
      nullif(trim(coalesce(elem->>'roll_number', '')), ''),
      nullif(trim(coalesce(elem->>'course', '')), ''),
      nullif(trim(coalesce(elem->>'semester', '')), ''),
      i
    );
  end loop;

  n := jsonb_array_length(p_faculty);
  for i in 0 .. n - 1 loop
    elem := p_faculty->i;
    fn := trim(coalesce(elem->>'full_name', ''));
    if fn = '' then
      continue;
    end if;
    insert into public.project_external_faculty (
      project_id, full_name, contribution
    )
    values (
      p_project_id,
      fn,
      nullif(trim(coalesce(elem->>'contribution', '')), '')
    );
  end loop;

  insert into public.payment_details (
    project_id,
    account_number,
    ifsc,
    holder_name,
    qr_code_url,
    paytm_qr_url
  )
  values (
    p_project_id,
    trim(p_account_number),
    trim(p_ifsc),
    trim(p_holder_name),
    nullif(p_qr_bank, ''),
    nullif(p_qr_paytm, '')
  )
  on conflict (project_id) do update
  set
    account_number = excluded.account_number,
    ifsc = excluded.ifsc,
    holder_name = excluded.holder_name,
    qr_code_url = coalesce(excluded.qr_code_url, public.payment_details.qr_code_url),
    paytm_qr_url = coalesce(excluded.paytm_qr_url, public.payment_details.paytm_qr_url);
end;
$$;

revoke all on function public.finalize_student_project_submission(
  uuid, jsonb, jsonb, text, text, text, text, text
) from public;

grant execute on function public.finalize_student_project_submission(
  uuid, jsonb, jsonb, text, text, text, text, text
) to authenticated;
