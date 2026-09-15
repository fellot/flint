-- Run AFTER creating the email/password accounts in Supabase Authentication.
-- Replace these three email addresses with the actual account emails.
-- Run as the database administrator in the SQL editor, not as an app user.
begin;
do $$
declare
  assignment record;
  account_id uuid;
begin
  for assignment in
    select * from (values
      ('1', 'felipeloturco@gmail.com'),
      ('2', 'loturco.pa@uol.com.br'),
      ('3', 'lorenzocecchini@gmail.com')
    ) as assignments(cellar_id, email)
  loop
    select id into account_id from auth.users where lower(email) = lower(assignment.email);
    if account_id is null then
      raise exception 'Create the Auth account for % before assigning its cellar.', assignment.email;
    end if;
    insert into public.cellar_members (cellar_id, user_id)
      values (assignment.cellar_id, account_id)
      on conflict do nothing;
  end loop;
end;
$$;
commit;
