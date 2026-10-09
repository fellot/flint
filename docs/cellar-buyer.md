# Cellar Essentials buyer

Implemented in the repository on 2026-09-29. Live provider quality and production rollout are not yet verified.

## Use and setup

Open **Cellar Essentials → Shopping list**. The map uses the selected cellar, with
separate states for stocked styles, personal journal styles no longer stocked,
styles without a match, and ambiguous blends requiring review. It covers all 39
Essentials. An absent match is not proof that someone has never tasted a style;
incomplete wine metadata can hide a match. Dessert styles remain optional.

Tell the buyer where you shop, optionally name retailers and a budget, then ask
for a small set of purchases. Follow up with constraints such as “three dry whites
under CAD 50,” “something ready this year,” or “research the remaining reds.”
The buyer asks for a market when it is missing. No account inherits Felipe's
retailer choices or shopping list. An empty cellar starts with a few contrasting
foundations rather than a request to buy every Essential.

- Configure the existing server-only `OPENAI_API_KEY` in Vercel and redeploy.
  All AI features use `gpt-6-luna`; the buyer needs Responses web-search access.
- Run [20261009000000_buyer_conversations.sql](../supabase/migrations/20261009000000_buyer_conversations.sql) in Supabase SQL Editor to enable saved conversations, then deploy the updated app. No new key or dependency is needed. The existing
  [My palate migration](../supabase/migrations/20260928000000_personal_palate.sql)
  and earlier inventory/journal migrations must already be applied. A missing
  palate table produces an actionable error rather than dropping preferences.
- Sent questions, replies and the shopping brief are saved privately by account and cellar. Reopen them through **Previous conversations** after reloading, changing cellars, or signing in on another device. Unsent drafts and PDF bytes stay in page memory. Research can be stopped or restarted.
- The former fixed shortlist in `data/cellar-shopping.ts` remains historical
  research and is no longer displayed as live shopping recommendations.

## Saved conversations (2026-10-09)

If SQL Editor reports `relation "public.cellars" does not exist`, the selected
database is missing Flint's base tables. Check the project against the website's
`NEXT_PUBLIC_SUPABASE_URL` (local configuration: `gfrtsvxvizlpxzrdxcgz`), then run
the read-only [buyer history diagnostic](../supabase/check-buyer-history.sql).
It reports required tables and wine/cellar tables in other schemas without reading
user or wine records. The migration now checks dependencies before creating any
history tables. Only a confirmed new installation should run the original schema
and setup migrations; do not create empty replacements in an existing database.

- **Previous conversations** lists your chats in the selected cellar, newest first,
  20 at a time. Open one to view its questions, replies, product cards and PDF page
  references, and continue it. Long chats load 20 turns at a time with **Load earlier
  messages**; the stored transcript is not truncated to the AI context limit.
- **New conversation** starts an empty chat and preserves earlier saved chats.
  A title comes from the first question; the pencil beside it lets you rename it.
- History is private to the authenticated account, including in a shared cellar.
  Both ownership and current cellar membership are checked in the API, RLS and
  write functions. Losing cellar access hides that cellar's chats.
- Old recommendations are historical records. The restored-chat notice explains
  that price/availability can change. Continuing always reloads current stock,
  journal-learning permissions and preferences. Only the most recent 11 completed
  user questions plus the new question, and narrow product references from the
  latest answer, go into the next request. Stored assistant prose is not replayed.
  Turning journal learning off does not delete already saved historical answers.
- PDF **filenames and cited pages** are saved, not the file contents. Reattach the
  PDF after reopening to ask new questions about it. Never rely on a former file's
  contents being available to the model.
- Chats from before this feature were never stored and cannot be recovered after
  leaving/reloading that page. Saving starts with new questions after deployment
  and applying the migration. It does not retroactively import old in-memory chats.

Storage: `buyer_conversations` (owner, cellar, title, brief, revision, timestamps)
plus `buyer_turns` (question, optional filename, reply or failure, status, ordinal).
`begin_buyer_turn` atomically saves the question before the AI call; a row lock,
revision check and pending-turn check reject stale/double submissions from other
tabs. `finish_buyer_turn` records the completed answer or controlled failure. An
abandoned pending question becomes resumable after 120 seconds; a late response
cannot overwrite a question already marked interrupted. If the answer cannot be
saved, the UI keeps it visible with an explicit warning, rather than reporting it
saved. Opening a conversation after an uncertain network result recovers whatever
reached the database. There is no automatic replay of a paid research call.

Reads and title edits use `/api/shopping/conversations` and
`/api/shopping/conversations/[id]`, always with a selected `cellarId`, private
no-store responses, and ownership checks. History writes require the new SQL
migration: a missing table/function produces the exact migration filename before
starting AI research. Existing old clients without a conversation ID retain the
previous nonpersistent response contract until refreshed.

The migration was executed twice in local Postgres tests, including same-cellar
member isolation, cross-cellar rejection, membership removal, direct-write denial,
revision conflicts, failed turns and stale-turn recovery. API tests cover resuming
from server history instead of browser-invented history, failure persistence and
failed answer writes. Browser checks use sample history and mocked AI/storage;
production Supabase deployment and live AI calls were not performed.

## Architecture and access

### PDF wine lists (2026-10-08)

In **Shopping list → Your wine buyer**, choose **Attach PDF wine list**, select
one PDF up to 3 MB, and send a question. Sending with the message blank asks for
recommendations from the list automatically. The buyer compares the list with
the current cellar's Essentials gaps and the acting user's permitted journal and
palate evidence. A shopping market is optional for advice from the PDF; it is
still needed for live retailer research.

PDF picks show their ranking, reason, price as printed when unambiguous, bottle
size/vintage when known, and a filename/page reference. Page numbers refer to the
physical PDF order. These are separate from web product cards: a document offer
does not establish current stock or pricing, and does not require a retailer URL.
Missing or case-only prices remain unconfirmed. The prompt asks the model to
explain unreadable lists or a lack of suitable gap-filling wines.

Selecting a file only reads it locally. Each **Send** includes the attached PDF
in an OpenAI Responses `input_file` alongside fresh authorized cellar context.
The model can read text and page images, including scanned lists. It receives
the same PDF on follow-ups until **Remove PDF**, **Replace PDF**, **Start fresh**,
reload, or a cellar switch. The file is held in page memory and is not saved to
Supabase, browser storage or the OpenAI Files API. Removing it stops future
transmission; earlier conversation text can still show its filename/citations.
PDF support itself needs no extra SQL, dependency or environment variable; saved
conversation history requires the migration listed above.

Browser/server validation bounds the file size, filename and canonical base64,
and checks the PDF header/trailer. It does not fully parse PDF objects or
independently verify cited page contents. Model interpretation and page references
still need user review; damaged/encrypted PDFs may need a fresh unlocked export.
Document instructions and filenames are treated as untrusted data. PDF-only picks
must pass the same gap, identity and explicit avoid-preference checks as web picks;
PDF URLs cannot substitute for web-search provenance. Current-document names and
page references provide follow-up context without retaining prior assistant prose.

See the [OpenAI PDF input guide](https://developers.openai.com/api/docs/guides/file-inputs).

### Request flow

`CellarEssentialsShopping` → `POST /api/ai/shopping` → authenticated cellar access
→ fresh Supabase stock, own journal and preferences → deterministic Essentials
coverage → one OpenAI Responses request with optional PDF and web search → validated
document and/or web product cards.

The browser supplies a cellar ID, up to 12 bounded user turns, shopping constraints
and at most six previous web references and six previous PDF references, plus an
optional PDF. It cannot choose the user, model or
inventory. The server verifies requested-cellar membership before loading data or
calling OpenAI. There is no separate hosted agent or fine-tuning service.

Coverage uses all positive-quantity stock; the descriptive model snapshot is capped
at 120 stock labels and 30 eligible own tastings, plus style-level taste patterns.
Only the acting user's journal participation, scores and comments are eligible.
Learning opt-out, dismissed styles, and faulty/too-young exclusions follow
[My palate](my-palate.md). With learning disabled, the visible map still shows
the user's journal matches, while the AI receives no journal history and cannot
distinguish those restocking opportunities from unexplored gaps.

Account identifiers, other participants, private inventory notes, shelf locations
and purchase prices are excluded. User-authored chat and personal preferences may
contain personal information. Prior assistant prose is not resent, preventing old
journal evidence from returning after an opt-out. Previous product names/URLs are
unverified context and must be researched again. The prompt limits search queries
to product/style and shopping-market terms. Shopping messages do not change the
saved palate profile.

## What a purchase card establishes

- An actual completed web search occurred during that request.
- Its public HTTP(S) link occurs in retrieved sources or provider citation
  annotations; a plausible model-written URL alone is insufficient.
- Its supplied identity matches the targeted Essential under the existing narrow
  matching rules, and that style is still absent from server-read stock.
- Field lengths, enums, vintage bounds and price/currency shape are validated.
  Duplicate URLs, unknown Essential IDs and uncertain-coverage gaps are excluded.
- The UI displays research time, retailer, vintage/size when known, price/currency
  or unknown, availability uncertainty, source evidence and drinking guidance.

URL provenance does **not** independently establish that every identity, price,
vintage or stock claim is correct. Those still involve model interpretation of
sources. The prompt requires exact-vintage evidence and treats a cached listing
alone as unconfirmed stock. There is no direct retailer inventory API. Review the
retailer page before buying. Research responses can include unavailable options
when that is what the sources establish; no match is also a valid outcome.

The app never purchases, reserves, adds stock or edits journal records from a
shopping response. Recommendation cards are retained as part of saved conversations; there is no separate wishlist.

## Limits and verification

Responses uses reasoning `low`, strict structured output, `store:false`, up to
5,500 output tokens and six tool calls per request. It returns at most six products,
with the prompt targeting at most four styles per turn. The provider timeout is
100 seconds, browser timeout 110 seconds, and route duration 120 seconds. There is
no streaming or automatic retry. Non-attachment request data retains a 40 KB limit;
the total request allows 4,236,352 bytes for a 3 MiB PDF encoded as base64 plus
conversation data. Requests have best-effort
per-instance duplicate suppression with a four-second completion cooldown;
distributed rate limiting and cost telemetry remain backlog items.

`store:false` is a request setting, not a statement about all provider retention.

`tests/shopping-pdf.test.ts` additionally covers browser/server file validation,
payload limits, native file input and follow-ups, source separation, PDF pick
validation, cellar authorization and provider errors. The full suite passed with
170 tests, along with typecheck and production build. The PDF browser checks used
a sample one-page list and mocked AI: desktop/mobile layout, selecting without
sending, blank-message sending, follow-up context, removal and invalid-file errors.
Live PDF interpretation and recommendation quality have not been verified.

`tests/shopping-advisor.test.ts` covers empty/independent cellar coverage, journal
privacy and opt-out, request bounds, authorized server context, source validation,
invalid product rejection, provider failures and cancellation. Browser checks use
explicitly labelled sample cellars and mocked research, including cellar switching,
desktop/mobile layouts and failure states. They do not verify live model access,
retailer coverage or research quality. No local OpenAI key was available for a
live-provider smoke check.

Before treating production as verified, test real research in two authorized
cellars, confirm account separation, and inspect exact-vintage retailer evidence
for representative reds, whites and sparkling wines.

References: [Responses web search](https://developers.openai.com/api/docs/guides/tools-web-search),
[structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
