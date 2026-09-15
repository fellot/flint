# Supabase setup and migration

Flint uses **email/password accounts** and **explicit cellar membership**. The browser never receives an admin key. Wine reads and writes use the signed-in user's session and Postgres row level security (RLS).

## 1. Create the project and tables

Create a Supabase project. In its **SQL Editor**, run the complete contents of:

- [`migrations/20260915000000_cellars_and_wines.sql`](migrations/20260915000000_cellars_and_wines.sql)

This transactional script creates `cellars`, `cellar_members`, and `wines`, their indexes, update timestamps, constraints, permissions, RLS policies, and the atomic `consume_wine` function. It also creates the three existing cellars:

| Cellar ID | Existing data file | Cellar | Language |
| --- | --- | --- | --- |
| `1` | `data/wines.json` | Felipe | English |
| `2` | `data/wines2.json` | Gerson | Portuguese |
| `3` | `data/wines3.json` | Lorenzo | Portuguese |

Apply this versioned schema once to a new database. If you already have a migration-managed project, copy the migration into it and apply through your usual Supabase CLI workflow.

## 2. Create the login accounts and assign access

In **Authentication → Users**, create each user's email/password account. The application has no public sign-up page. Disable new-user signups in the project's Auth settings if this is a private deployment.

Edit the three email addresses in [`assign-cellars.sql`](assign-cellars.sql), then run it in the SQL Editor. It fails without making changes if any account does not exist. Adding another member to a cellar uses the same `cellar_members` table. An account with multiple memberships gets a cellar selector. An account with no membership sees instructions to contact the cellar owner and cannot read any wine records.

Existing PINs do not become passwords. Give each account its own password, or use a Supabase invite with the invite template below. To revoke access, delete the relevant membership in Supabase; the database checks membership on each wine query.

## 3. Import the wines

Use Node.js 22 or newer:

```bash
nvm use
npm ci
npm run migrate:wines
```

The default command validates all files without connecting to Supabase. The current snapshot contains **138 wine records: 53 + 81 + 4**.

For an import through the SQL Editor, generate a new SQL file:

```bash
npm run migrate:wines -- --sql /tmp/flint-wines.sql
```

Run the generated file in the SQL Editor after the schema. The export refuses to overwrite an existing output file. Both schema and data import run in transactions. Re-running the import skips existing `(cellar_id, id)` records, preserving edits already made in Supabase. It does not synchronize subsequent JSON changes or restore deletions intentionally made after cutover; use the importer only during migration.

Alternatively, set `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) in your untracked `.env.local`, along with the project URL, and run:

```bash
npm run migrate:wines -- --apply
```

The script sends one atomic insert with duplicate IDs ignored. **This admin key is only for the import script.** The running app needs only the publishable key. Remove the admin key after importing.

The importer preserves IDs, cellar separation, quantities, history, notes, ratings on the existing 0–100 scale, Coravin fields, and maturity text such as `Past peak` and `2040+`. Optional empty fields receive database defaults. Only HTTP(S) URLs are retained for images and technical sheets. A `--data-dir <directory>` option supports a newer export with the same three filenames.

If production currently writes through GitHub, obtain the latest copies of all three JSON files and pause writes during the final export/import. Check the results before switching the deployment:

```sql
select cellar_id, count(*) as wine_records, sum(quantity) as bottles
from public.wines
group by cellar_id
order by cellar_id;
```

## 4. Configure the app

Copy `.env.example` to `.env.local`, then set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

A legacy anon key is supported through `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of the publishable key. Add the same variables to the hosting environment, using the production origin for `NEXT_PUBLIC_SITE_URL`. These public variables are embedded at build time, so rebuild after changing them. Set the hosting runtime to Node.js 22 or newer. Existing AI features continue to use `OPENAI_API_KEY`.

`SITE_PIN`, `SITE_PIN_2`, `SITE_PIN_3`, `PIN_SALT`, and the GitHub storage variables are no longer used. JSON files are retained as migration source data and are never read or written by the wine API. Missing Supabase configuration denies access rather than falling back to local storage.

## 5. Configure password recovery and optional invitations

In **Authentication → URL Configuration**:

- Set **Site URL** to your app's origin.
- Allow `http://localhost:3000/auth/callback` for local development and `https://YOUR_DOMAIN/auth/callback` for production.

In **Authentication → Email Templates**, use the following link in the **Reset Password** template:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
```

For the **Invite user** template:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite">Accept invitation and set a password</a>
```

These links verify the token on the server and open `/reset-password`. The callback also supports PKCE authorization codes. Configure SMTP for production delivery. Use a separate development project or update the Site URL when testing email links locally. The recovery endpoint generates a callback using `NEXT_PUBLIC_SITE_URL`; the templates above use the project's configured Site URL, so keep them aligned.

## 6. Verify and deploy

```bash
npm test
npm run typecheck
npm run build
npm start
```

Automated tests execute the schema and imports in PGlite (embedded Postgres), check data preservation and idempotency, and verify that one user's session cannot read or change another cellar's wines or grant itself membership. They also cover validation, safe redirects, and consumption rollback when a history insert fails.

In the real project, sign in with each account and check: cellar and journal records, add/edit/delete, map/sommelier language, sign-out, recovery links, and access denial for another cellar's `dataSource`. Test bottle consumption as well. Live Auth/email delivery requires the configured Supabase project and is not covered by the embedded database tests.

This change does not create a hosted project, apply remote SQL, create real accounts, or deploy the app automatically.

## References

- [Supabase server-side clients and session refresh](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [Email/password authentication and recovery](https://supabase.com/docs/guides/auth/passwords)
- [Postgres row level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
