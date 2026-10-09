-- READ ONLY: run in Supabase SQL Editor and paste the one-row result back.
-- Local Flint configuration points to project gfrtsvxvizlpxzrdxcgz.
-- This inspects table/column names, never wine records, users or credentials.
select jsonb_build_object(
  'database', current_database(),
  'database_role', current_user,
  'required_tables', (
    select jsonb_object_agg(name, to_regclass(name) is not null)
    from (values ('public.cellars'), ('public.cellar_members'), ('auth.users'),
      ('public.buyer_conversations'), ('public.buyer_turns')) as required(name)
  ),
  'wine_and_cellar_tables', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', t.table_schema,
      'table', t.table_name,
      'columns', (
        select jsonb_agg(jsonb_build_object('name', c.column_name, 'type', c.data_type)
          order by c.ordinal_position)
        from information_schema.columns c
        where c.table_schema = t.table_schema and c.table_name = t.table_name
      )
    ) order by t.table_schema, t.table_name), '[]'::jsonb)
    from information_schema.tables t
    where t.table_schema not in ('pg_catalog', 'information_schema', 'auth', 'storage')
      and (t.table_name ilike '%cellar%' or t.table_name ilike '%wine%'
        or t.table_name ilike '%buyer%' or t.table_name = 'palate_preferences')
  )
) as buyer_history_setup_check;
