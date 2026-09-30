-- One-time administrative password reset for Felipe's Flint login.
-- Run manually in Supabase > SQL Editor as the postgres role.
-- This is NOT a migration. Do not commit a copy containing a real password.
-- Replace only CHANGE_THIS_PASSWORD below, keeping the dollar-quote delimiters.
-- Choose a unique password satisfying your project's password requirements.
-- SQL text can remain in editor history/logs; the app's Forgot password flow
-- avoids putting a new plaintext password in SQL.
-- Direct SQL bypasses Auth password-policy checks and does not revoke sessions.
-- Sources:
-- https://supabase.com/docs/guides/auth/password-security
-- https://www.postgresql.org/docs/current/pgcrypto.html

do $reset_password$
declare
  target_email constant text := 'felipeloturco@gmail.com';
  new_password text := $flint_password$CHANGE_THIS_PASSWORD$flint_password$;
  target_user_id uuid;
  crypto_schema text;
  affected_rows integer;
begin
  if new_password = '999888' then
    raise exception 'Replace CHANGE_THIS_PASSWORD with your new password before running.';
  end if;
  if char_length(new_password) < 8 or octet_length(new_password) > 72 then
    raise exception 'Use at least 8 characters and at most 72 UTF-8 bytes for this bcrypt reset.';
  end if;

  -- Discover pgcrypto's actual schema instead of assuming its installation path.
  select n.nspname into crypto_schema
  from pg_catalog.pg_extension e
  join pg_catalog.pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if crypto_schema is null then
    raise exception 'Enable pgcrypto in Supabase Database > Extensions, then rerun.';
  end if;

  -- Require exactly one account and lock it for the duration of this statement.
  begin
    select u.id into strict target_user_id
    from auth.users u
    where lower(u.email) = lower(target_email)
    for update;
  exception
    when no_data_found then
      raise exception 'No account found for %. No password was changed.', target_email;
    when too_many_rows then
      raise exception 'More than one account matches %. No password was changed.', target_email;
  end;

  execute format(
    'update auth.users
     set encrypted_password = %I.crypt($1, %I.gen_salt(''bf'', 10)),
         updated_at = now()
     where id = $2',
    crypto_schema, crypto_schema
  ) using new_password, target_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Expected one updated account. The password change was rolled back.';
  end if;

  raise notice 'Password updated for %. Sign in to Flint with the new password.', target_email;
end;
$reset_password$;
