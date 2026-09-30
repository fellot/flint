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
- No new SQL or dependency is needed for this feature. The existing
  [My palate migration](../supabase/migrations/20260928000000_personal_palate.sql)
  and earlier inventory/journal migrations must already be applied. A missing
  palate table produces an actionable error rather than dropping preferences.
- Conversation and shopping constraints stay in page memory. Switching between
  Field guide and Shopping list keeps the conversation; changing cellars or
  reloading starts fresh. Research can be stopped or restarted.
- The former fixed shortlist in `data/cellar-shopping.ts` remains historical
  research and is no longer displayed as live shopping recommendations.

## Architecture and access

`CellarEssentialsShopping` → `POST /api/ai/shopping` → authenticated cellar access
→ fresh Supabase stock, own journal and preferences → deterministic Essentials
coverage → one OpenAI Responses request with web search → validated product cards.

The browser supplies a cellar ID, up to 12 bounded user turns, shopping constraints
and at most six previous product references. It cannot choose the user, model or
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
shopping response. No wishlist or product research is persisted in Supabase yet.

## Limits and verification

Responses uses reasoning `low`, strict structured output, `store:false`, up to
5,500 output tokens and six tool calls per request. It returns at most six products,
with the prompt targeting at most four styles per turn. The provider timeout is
100 seconds, browser timeout 110 seconds, and route duration 120 seconds. There is
no streaming or automatic retry. Requests have a 40 KB limit and best-effort
per-instance duplicate suppression with a four-second completion cooldown;
distributed rate limiting and cost telemetry remain backlog items.

`store:false` is a request setting, not a statement about all provider retention.

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
