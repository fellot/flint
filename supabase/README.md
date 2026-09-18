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

Use Node.js 22.x:

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

The script sends one atomic insert with duplicate IDs ignored. **This key stays on the server.** The app also uses it to send account invitations from the owner’s People dialog. Wine and journal reads/writes continue to use each signed-in user’s session.

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

A legacy anon key is supported through `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of the publishable key. Add the same variables to the hosting environment, using the production origin for `NEXT_PUBLIC_SITE_URL`. These public variables are embedded at build time, so rebuild after changing them. Set the hosting runtime to Node.js 22.x, matching `package.json` and `.nvmrc`. Existing AI features continue to use `OPENAI_API_KEY`.

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

## 6. Add people and personal journals (existing and new installations)

After importing the wines and assigning the initial accounts, run the complete
[`migrations/20260916000000_people_and_journals.sql`](migrations/20260916000000_people_and_journals.sql)
in Supabase **SQL Editor → New query → Run**, once. Existing installations need
only this new migration; do not rerun the original schema or wine import.
Apply it just before deploying the updated app, since it replaces the consumption function.

The script sets the existing cellar owners from the account emails in
`assign-cellars.sql`: Felipe for cellar 1, Gerson for 2, Lorenzo for 3. Alice stays
a regular member of cellar 1. Check those owner emails at the top of the script
before running it if the accounts have changed. It adds:

- `cellar_members.role`: owner or member. Only owners can add people.
- `cellar_people`: account identities and pending email invitations.
- `wine_participants`: who shared each consumed wine record.
- `wine_reviews`: each participant’s own 0–100 integer score and comment.

Existing consumed wines are assigned to their cellar owner’s journal. Historical
shared ratings and notes stay on the wine record, labeled as previous cellar
information; they are not attributed as anyone’s personal review. Historical
Wine Heaven/Hell locations are cleared. New consumption uses the `consumed` status.
Scores and comments are protected by RLS: only the participant can read or change
their own review, and they must retain access to that cellar.

### Enable owner-created accounts

In **Vercel → Project → Settings → Environment Variables**, add:

- `SUPABASE_SECRET_KEY`: your Supabase project's **secret** API key (`sb_secret_…`).
  The legacy `SUPABASE_SERVICE_ROLE_KEY` is also accepted. Do not prefix this with
  `NEXT_PUBLIC_` and do not put it in source control.
- Keep `NEXT_PUBLIC_SITE_URL` set to your deployed website origin.

Use `.env.local` for the same server-only key if you want to send invitations
from local development. The existing publishable key is still used for all
regular wine operations. Configure SMTP and the **Invite user** email template
from section 5; invitations use Supabase’s email delivery. Allow the deployment’s
`/auth/callback` URL in Supabase Auth URL Configuration.

Commit/push the updated code through your normal workflow. Vercel will build the
new commit. If environment variables were added after that build, open
**Deployments → latest deployment → Redeploy**. Check the variables are enabled
for the environment being deployed (Production, and Preview only if needed).

As owner, open **People** above the wine table and enter a name and email:

- An existing verified account gets access immediately.
- A new account receives an email invitation to set its password. The person
  remains **Pending** until they accept; they cannot be selected for a tasting yet.
- If sending fails, Flint shows the failure and lets the owner retry. No success
  message is shown for failed delivery. Existing accounts can also use password reset.
- Without the secret key, existing verified accounts can still be added; new
  account invitations remain unavailable.

When opening a bottle, choose its participants and optionally enter your own
score and comment. Inventory, participants and that review are saved atomically.
Every selected user sees the wine in their personal journal and writes their own
review. The journal defaults to highest personal score first, with unrated wines
last; every table heading still supports sorting. Wines logged outside the cellar
use the same participant/review step. One partial consumption creates a distinct
journal record, so later tastings of the remaining bottles can have different people.

## 7. Add participants later and rank by wine type

For an existing installation, copy the complete contents of
[`migrations/20260916010000_add_tasting_participants.sql`](migrations/20260916010000_add_tasting_participants.sql)
into **Supabase → SQL Editor → New query → Run**. Apply it after the people/journals
migration from section 6, then deploy the updated application. This adds one
function and can be rerun safely. No new environment variables are needed.

In the journal, click the **Add participants** icon on a wine's row, or open its
details and choose **Add participants**. Select the additional people and save.
The wine appears in their journals when they next load or refresh them, initially
unrated. Existing participants, reviews, consumption dates and bottle quantities
stay unchanged. Only the cellar owner or an existing participant may add people;
the added people must have active accounts with access to the same cellar.
The owner can invite new accounts using **People** first.

Use **Rank by wine type** above the journal table to choose **Red**, **White**, or
any other style in your journal. Selecting a type starts with your highest scores
first; column sorting, search, and **Still to rate** work within that type.
**All types** restores the full ranking. The same type selector is also available
inside **Filters**.

## 8. Managed wine fridges and selectable locations

Run the complete contents of
[`migrations/20260916020000_managed_wine_fridges.sql`](migrations/20260916020000_managed_wine_fridges.sql)
in **Supabase → SQL Editor → New query → Run**, after the preceding migrations.
Then deploy the updated app to Vercel. No new environment variables are needed.
For a new installation, import the existing wines before running this migration.

This migration configures Felipe's **Wine Fridge A with seven levels, L1–L7**.
It shifts existing locations in that fridge exactly once: **L0 → L1, L1 → L2,
… L6 → L7**, including existing capitalization and spacing variations. It does
not shift other cellars' levels. Running the script again does not shift wines
again or overwrite later fridge edits. Bottle quantities and personal reviews
are preserved.

Owners can open **Wine fridges** above the inventory table, or **Manage wine
fridges** beside the location picker. Add or rename fridges, set the number of
levels, choose whether numbering starts at L0 or L1, and remove empty fridges.
Each level displays its current bottle count. Rename changes cascade to the
wine records automatically. Occupied levels cannot be removed: first edit those
wines and select another location (or **Not assigned yet**).

Manual add, AI-assisted add, and wine edit forms now use a location list grouped
by fridge. Everyone with cellar access can select locations; only the owner can
manage fridges. Unrecognized existing descriptions remain selectable under
**Other existing locations**, so combined locations and storage outside a fridge
are preserved. New arbitrary location text is rejected by the database.
Consumed wines leave storage and remain in their participants' journals.

## 9. Merge Wine Cellar A into Wine Fridge A

Run [`migrations/20260917000000_merge_wine_fridge_a.sql`](migrations/20260917000000_merge_wine_fridge_a.sql)
in **Supabase → SQL Editor**, after the managed-fridges migration above.
It combines the two names in Felipe's cellar under **Wine Fridge A**, preserving
current level numbers: **Wine Cellar A - L3 → Wine Fridge A - L3**. It does not
repeat the earlier L0 → L1 shift. Existing bottle records, quantities, scores,
and comments stay intact; the duplicate fridge is removed only after its wines
have moved. The resulting fridge includes every existing level from either name.
Other cellars are unaffected, and the script can be rerun safely.

Refresh the app after running the script. The location merge does not require
new environment variables or a separate application deployment.

## 10. Verify and deploy

```bash
npm test
npm run typecheck
npm run build
npm start
```

Automated tests execute the schema and imports in PGlite (embedded Postgres), check data preservation and idempotency, and verify that one user's session cannot read or change another cellar's wines or grant itself membership. They also cover validation, safe redirects, and consumption rollback when a history insert fails.

In the real project, sign in with each account and check: cellar and journal records, add/edit/delete, map/sommelier language, sign-out, recovery links, and access denial for another cellar's `dataSource`. Test bottle consumption as well. Live Auth/email delivery requires the configured Supabase project and is not covered by the embedded database tests.

Development does not apply remote SQL or deploy the app automatically. Account invitation emails are sent only when an owner uses the People action in the configured app.

## Wine recommendation review

The [September 2026 review](reviews/20260917-wine-audit.md) covers all 29 in-stock wines in the owner's supplied Supabase export, with sources, reasoning, uncertainty, and three bottle-label checks. It proposes changes to 16 records.

Run the complete [review SQL](reviews/20260917-wine-audit.sql) in Supabase's SQL Editor to apply the four-field corrections. It preserves other cellar data, skips wines no longer in stock, and aborts if a targeted recommendation has been edited since the export. A guarded [rollback script](reviews/20260917-wine-audit.rollback.sql) is provided. These are manual data-review scripts, not automatic schema migrations; no deployment is needed.

The supplied inventory and decisions are retained in the [audit JSON](reviews/20260917-wine-audit.json). Developers can regenerate the report and SQL with `node --import tsx scripts/build-wine-review.ts`; users can run the already-generated SQL directly.

## References

- [Supabase server-side clients and session refresh](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [Owner account invitations](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [Email/password authentication and recovery](https://supabase.com/docs/guides/auth/passwords)
- [Postgres row level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
