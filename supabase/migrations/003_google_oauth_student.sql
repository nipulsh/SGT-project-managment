-- Google OAuth sign-ups are always student (ignore any client-supplied role).
-- Run in Supabase SQL editor after 001 (+ 002 if used).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
  n text;
  is_google boolean;
begin
  is_google := coalesce(new.raw_app_meta_data->>'provider', '') = 'google';

  if is_google then
    r := 'student';
  else
    r := coalesce(new.raw_user_meta_data->>'role', 'student');
    if r not in ('student', 'faculty', 'dean') then
      r := 'student';
    end if;
  end if;

  n := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into public.users (id, name, role)
  values (new.id, n, r);
  return new;
end;
$$;
