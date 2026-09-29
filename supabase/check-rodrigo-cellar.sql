-- READ ONLY: run in Supabase SQL Editor with its role set to postgres.
-- Paste the one-row result back if the setup script still fails.
-- Does not create accounts, assign access or change existing data.
select jsonb_build_object(
  'database_role', current_user,
  'auth_accounts', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id,
      'email', email,
      'email_confirmed', email_confirmed_at is not null
    )), '[]'::jsonb)
    from auth.users
    where lower(trim(email)) = 'rodrigoramosvieira@gmail.com'
  ),
  'required_tables', (
    select jsonb_object_agg(table_name, to_regclass(table_name) is not null)
    from (values ('public.cellars'), ('public.cellar_members'),
      ('public.cellar_people'), ('public.wines'), ('public.cellar_storage_locations')) required(table_name)
  ),
  'membership_role_column', exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cellar_members' and column_name = 'role'
  ),
  'membership_person_trigger', exists (
    select 1 from pg_trigger where tgrelid = to_regclass('public.cellar_members')
      and tgname = 'cellar_member_person' and tgenabled <> 'D'
  ),
  'storage_initialization_trigger', exists (
    select 1 from pg_trigger where tgrelid = to_regclass('public.cellars')
      and tgname = 'initialize_cellar_storage' and tgenabled <> 'D'
  )
) as rodrigo_setup_check;
