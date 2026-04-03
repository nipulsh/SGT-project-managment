-- Backfills public.users when the auth trigger was missing or failed (fixes /login?error=profile after OAuth).
-- Safe to run multiple times.

create or replace function public.ensure_auth_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
  n text;
  prov text;
begin
  if auth.uid() is null then
    return;
  end if;

  if exists (select 1 from public.users where id = auth.uid()) then
    return;
  end if;

  select
    coalesce(au.raw_app_meta_data->>'provider', ''),
    coalesce(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      split_part(au.email, '@', 1)
    )
  into prov, n
  from auth.users au
  where au.id = auth.uid();

  if prov = 'google' then
    r := 'student';
  else
    select coalesce(au.raw_user_meta_data->>'role', 'student')
    into r
    from auth.users au
    where au.id = auth.uid();
    if r not in ('student', 'faculty', 'dean') then
      r := 'student';
    end if;
  end if;

  insert into public.users (id, name, role)
  values (auth.uid(), coalesce(nullif(trim(n), ''), 'User'), r)
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.ensure_auth_profile() from public;
grant execute on function public.ensure_auth_profile() to authenticated;
