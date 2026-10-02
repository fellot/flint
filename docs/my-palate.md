# My palate: personal sommelier context

Implemented in the repository on 2026-09-28. Apply the migration and deploy before using it in production.

## Setup

1. In Supabase → SQL Editor → New query, run the complete contents of [`20260928000000_personal_palate.sql`](../supabase/migrations/20260928000000_personal_palate.sql). Run this after the existing cellar/journal migrations. It is safe to rerun: existing preferences are preserved.
2. For the grape profile, run [`20261002000000_grape_profile.sql`](../supabase/migrations/20261002000000_grape_profile.sql) in the same SQL Editor. It adds a validated JSON column to your existing personal preferences; it is safe to rerun and preserves existing data and access rules.
3. Deploy this application revision. The existing server-only `OPENAI_API_KEY` powers both sommelier interfaces, the evening planner and the Cellar Essentials buyer. No new package or API key is needed.
4. Open **My palate** in the sidebar, account menu, journal, or sommelier. Edit preferences and press **Save my palate**.

The migration seeds only the confirmed account `felipeloturco@gmail.com` with the owner's stated adventurous/avoid-semi-sweet/no-fixed-budget preferences, if that account exists. Other users start neutral. No global personal preferences are hard-coded into the app. A missing migration produces an actionable error rather than silently losing preferences.

## What is saved

`palate_preferences` is keyed by Supabase Auth user ID. Row-level security permits only that user to read, insert, update or delete their profile. Cellar ownership does not grant access to another user's palate. Preferences follow the account between cellars; journal evidence uses only the selected, authorized cellar and the acting user's participation/reviews.

Fields: discovery (`familiar`, `balanced`, `adventurous`), avoid-semi-sweet, free-text preferences (2,000 characters), journal-learning toggle, dismissed Cellar Essential pattern IDs, grape preferences, update timestamp. The API never takes a user ID from the caller. A reset restores neutral preferences and clears explicit grape labels/notes; it does not delete tastings. Disabling learning stops journal context being sent on subsequent requests. Existing on-screen replies are not erased retroactively.

## Grape profile

The **Your taste, by grape** section combines personal input with explainable evidence. It does not call an AI to calculate scores or save inferred likes.

- Choose **Love**, **Like**, **Neutral**, **Avoid**, or **Want to explore**, with an optional 240-character note. Up to 40 explicit preferences are saved per account; journal grapes are not limited by this input limit. Search accepts names and supported synonyms such as Shiraz/Syrah and Pinot Grigio/Pinot Gris. Adding a new grape explicitly starts it as “Want to explore”; change the label at any time.
- A curated catalogue in `data/grapes.ts` supplies stable IDs. Unlisted varieties can be described in general palate notes. The migration validates the same catalogue; expanding it requires updating both the data and SQL validation function.
- Journal evidence uses only eligible personal tastings in the selected cellar. Learning opt-out, dismissed patterns, and exact faulty/too-young tasting tags apply. Save learning-setting changes to refresh the derived cards.
- Scores are **averages of wines recorded with a single grape**, not ratings of the grape itself. Each recorded label/vintage/country gets one vote after averaging repeated scored tastings. Unrated wines count as exposure, never zero scores. A real score of 0 counts.
- Blends and partial compositions show appearances and the original evidence, but contribute no single-grape average. A lone grape marked “dominant”, “90%”, “others”, or accompanied by an unrecognized component remains partial. The app uses the recorded grapes field; it does not guess composition from appellation or bottle name. A single recorded variety is not a certification of 100% purity.
- Each card exposes the original wine, vintage, style, origin, score and personal comment. Different styles can share a grape: liking sweet Riesling does not establish a preference for every dry Riesling. Counts describe available evidence, not statistical confidence or a sensory diagnosis.
- Explicit labels take precedence over inferred journal clues. Known **Avoid** grapes exclude candidates in the sommelier/evening picker and verified shopping products, including blends and supported synonyms. Unknown composition stays uncertain; the prompt requires disclosure instead of claiming a grape is absent. “Neutral” and “Want to explore” do not become inferred likes.
- Existing clients that save the older preference fields without `grape_preferences` preserve the new field. Reading an unmigrated row defaults to an empty explicit list; trying to save the new field without its migration returns an actionable SQL filename.

The API sends bounded grape summaries alongside the existing permitted journal context. The integration follows the existing [OpenAI prompt-context guidance](https://developers.openai.com/api/docs/guides/prompt-engineering); no additional model call is added.

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
2. Exclude unavailable/zero-quantity stock and known appearances of explicitly avoided grapes. If selected, exclude explicitly recorded semi-sweet descriptors in the bottle/style fields; do not infer every Riesling or dessert wine is semi-sweet. Unknown sweetness/composition remains unknown and the prompt requires disclosure/clarification when relevant.
3. Prioritize supported estimates: within two years of a numeric peak, then inside a recorded window, then uncertain, then beyond a closed window, then future. Future windows override contradictory peak claims; `+` windows are open ended. A past peak is never an automatic urgent recommendation. The ±2-year band is a product heuristic, not new producer guidance.
4. Provide at most 80 candidates and 80 recent eligible personal reviews, bounded notes, explicit preferences and evidence-count patterns. Other participants, account identifiers, private inventory notes, prices and shelf locations are excluded. The user's own free text may contain personal information.
5. One `gpt-6-luna` Chat Completions call identifies up to four suitable wines and explains each, or returns an answer/question. Food and free-text suitability are still model judgments; the server sorts the model's suitable set by maturity, then supported taste affinity (except adventurous mode, which retains model ordering within a maturity tier).
6. Validate IDs, fields, sizes and actual journal evidence references. Resolve bottle metadata from the server, never a model-invented identity. Rank suitable suggestions in code and display a contrasting unfamiliar alternative when one was supplied and can be established from this journal's coverage.

The drinking sommelier does not guarantee full-cellar optimality, infer unrecorded sweetness/chemistry, search live shops, purchase bottles, or learn hidden permanent preferences from chat. The separate [Cellar Essentials buyer](cellar-buyer.md) now uses the same permitted personal context to research shopping options. Mature-but-unsuitable wines must not be included just to satisfy ranking. Larger-cellar retrieval and a quality evaluation with live provider responses remain future work.

The evening planner keeps its occasion filters but makes no automatic pick or local fallback.
“Surprise me” and “Another idea · AI” each request a fresh personalized choice. It can use
optional approximate location, current weather and local time alongside mood and taste;
see [contextual evening picks](evening-picks.md).

### Chat and data controls

Clients send up to 12 recent user turns and the last discussed wine ID. The server rejects system/developer roles and rebuilds wine context from authorized data. It drops prior assistant prose so old journal citations and shelf locations are not recycled into later requests. User-written chat is still sent as conversation; the learning toggle cannot remove facts the user explicitly types into it. The floating and full-page chats are separate in-memory conversations.

Provider settings: `gpt-6-luna` (shared with every AI feature), reasoning effort `none`, strict JSON schema, temperature 0.4, `max_completion_tokens: 2200`, timeout 22 seconds, `store:false`; chat route limit 30 seconds, evening route 60 seconds including optional weather lookup. `store:false` is a request setting, not a claim about all provider retention. No automatic provider retries. Evening plans use best-effort per-user in-flight suppression and a 1.5-second cooldown; distributed limiting and usage tracking are not implemented.

## Validation

`tests/palate.test.ts` covers account isolation and repeatable SQL with PGlite, migration compatibility, zero scores, duplicate tastings, exclusions, opt-out/dismissal, uncertain maturity, semi-sweet distinctions, context minimization, malformed provider output, invented IDs/evidence, server ranking and mocked provider replies. UI preview uses visibly labeled sample journal data and mocked saves/AI, not production accounts.

`tests/grape-profile.test.ts` adds synonym and composition parsing, blend-score separation, repeat-vintage weighting, unrated/zero values, fault/ownership/opt-out exclusions, explicit labels, request limits, legacy-client preservation, and repeatable migration/data validation with RLS. Shopping tests verify avoided-grape product filtering.

Official API reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
