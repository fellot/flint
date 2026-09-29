# My palate: personal sommelier context

Implemented in the repository on 2026-09-28. Apply the migration and deploy before using it in production.

## Setup

1. In Supabase → SQL Editor → New query, run the complete contents of [`20260928000000_personal_palate.sql`](../supabase/migrations/20260928000000_personal_palate.sql). Run this after the existing cellar/journal migrations. It is safe to rerun: existing preferences are preserved.
2. Deploy this application revision. The existing server-only `OPENAI_API_KEY` powers both sommelier interfaces and the evening planner. No new package or API key is needed.
3. Open **My palate** in the sidebar, account menu, journal, or sommelier. Edit preferences and press **Save my palate**.

The migration seeds only the confirmed account `felipeloturco@gmail.com` with the owner's stated adventurous/avoid-semi-sweet/no-fixed-budget preferences, if that account exists. Other users start neutral. No global personal preferences are hard-coded into the app. A missing migration produces an actionable error rather than silently losing preferences.

## What is saved

`palate_preferences` is keyed by Supabase Auth user ID. Row-level security permits only that user to read, insert, update or delete their profile. Cellar ownership does not grant access to another user's palate. Preferences follow the account between cellars; journal evidence uses only the selected, authorized cellar and the acting user's participation/reviews.

Fields: discovery (`familiar`, `balanced`, `adventurous`), avoid-semi-sweet, free-text preferences (2,000 characters), journal-learning toggle, dismissed Cellar Essential pattern IDs, update timestamp. The API never takes a user ID from the caller. A reset restores neutral preferences; disabling learning stops journal context being sent on subsequent requests. Existing on-screen replies are not erased retroactively.

## What the journal contributes

- Only `status=consumed`, `inMyJournal=true`, `myRating` and `myComment` form personal evidence. Legacy cellar ratings/notes, critic ratings, ownership and badges are not preferences.
- Patterns use the existing narrow Cellar Essentials classifiers. Above-baseline means at least one point above the user's average, with one vote per distinct recorded label/vintage/country. Repeated tastings of the same recorded wine/vintage are averaged, not extra confidence.
- One distinct wine is an **early clue**; two to four are **emerging**; five or more are a **repeated pattern**. These are descriptive evidence counts, not calibrated statistical confidence. Single tastings do not receive a deterministic taste boost.
- Dismissing a pattern excludes its matching journal records from AI learning; restoring it makes them eligible again. The profile page retains the overall baseline so the owner can inspect their journal.
- New scores, edits, deletions and access changes take effect at the next request. No stale model-written profile cache is maintained.
- Optional tasting buttons append reversible, ordinary lines to the personal comment. The exact English/Portuguese “Too young to judge” and “Bottle seemed faulty” lines exclude that tasting from learning; arbitrary prose is not automatically classified by that rule. Other comments are interpreted by the model as contextual evidence.

## Recommendation flow

Both `POST /api/ai/sommelier` and `POST /api/ai/reserve` use `lib/ai/personal-sommelier.ts` and `lib/ai/cellar-context.ts`:

1. Authenticate, verify cellar membership, read fresh inventory and own journal from Supabase, read the account's preferences.
2. Exclude unavailable/zero-quantity stock. If selected, exclude explicitly recorded semi-sweet descriptors in the bottle/style fields; do not infer every Riesling or dessert wine is semi-sweet. Unknown sweetness remains unknown and the prompt requires disclosure/clarification when relevant.
3. Prioritize supported estimates: within two years of a numeric peak, then inside a recorded window, then uncertain, then beyond a closed window, then future. Future windows override contradictory peak claims; `+` windows are open ended. A past peak is never an automatic urgent recommendation. The ±2-year band is a product heuristic, not new producer guidance.
4. Provide at most 80 candidates and 80 recent eligible personal reviews, bounded notes, explicit preferences and evidence-count patterns. Other participants, account identifiers, private inventory notes, prices and shelf locations are excluded. The user's own free text may contain personal information.
5. One `gpt-6-luna` Chat Completions call identifies up to four suitable wines and explains each, or returns an answer/question. Food and free-text suitability are still model judgments; the server sorts the model's suitable set by maturity, then supported taste affinity (except adventurous mode, which retains model ordering within a maturity tier).
6. Validate IDs, fields, sizes and actual journal evidence references. Resolve bottle metadata from the server, never a model-invented identity. Rank suitable suggestions in code and display a contrasting unfamiliar alternative when one was supplied and can be established from this journal's coverage.

The AI does not guarantee full-cellar optimality, infer unrecorded sweetness/chemistry, search live shops, purchase bottles, or learn hidden permanent preferences from chat. Mature-but-unsuitable wines must not be included just to satisfy ranking. Larger-cellar retrieval and a quality evaluation with live provider responses remain future work.

The evening planner keeps its existing occasion filters and local fallback. Only the explicit AI action is personalized. Main-card shuffling remains local, not an AI request.

### Chat and data controls

Clients send up to 12 recent user turns and the last discussed wine ID. The server rejects system/developer roles and rebuilds wine context from authorized data. It drops prior assistant prose so old journal citations and shelf locations are not recycled into later requests. User-written chat is still sent as conversation; the learning toggle cannot remove facts the user explicitly types into it. The floating and full-page chats are separate in-memory conversations.

Provider settings: `gpt-6-luna` (shared with every AI feature), reasoning effort `none`, strict JSON schema, temperature 0.4, `max_completion_tokens: 2200`, timeout 22 seconds, `store:false`; route limit 30 seconds. `store:false` is a request setting, not a claim about all provider retention. No automatic provider retries. Evening plans retain the existing best-effort 10-second per-user cooldown; distributed limiting and usage tracking are not implemented.

## Validation

`tests/palate.test.ts` covers account isolation and repeatable SQL with PGlite, migration compatibility, zero scores, duplicate tastings, exclusions, opt-out/dismissal, uncertain maturity, semi-sweet distinctions, context minimization, malformed provider output, invented IDs/evidence, server ranking and mocked provider replies. UI preview uses visibly labeled sample journal data and mocked saves/AI, not production accounts.

Official API reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
