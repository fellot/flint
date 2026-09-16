-- Run in the Supabase SQL Editor for the Flint project.
-- Alice's Auth account must already exist. Safe to run more than once.
begin;

do $$
declare
  alice_id uuid;
begin
  select id into alice_id
    from auth.users
    where lower(email) = 'alicepaik@gmail.com';

  if alice_id is null then
    raise exception 'Create the Auth account for alicepaik@gmail.com first.';
  end if;

  insert into public.cellar_members (cellar_id, user_id)
    values ('1', alice_id)
    on conflict (cellar_id, user_id) do nothing;
end;
$$;

commit;

-- Verify Alice's membership in Felipe's cellar.
select u.email, c.id as cellar_id, c.name as cellar_name
  from public.cellar_members m
  join auth.users u on u.id = m.user_id
  join public.cellars c on c.id = m.cellar_id
  where lower(u.email) = 'alicepaik@gmail.com' and c.id = '1';
