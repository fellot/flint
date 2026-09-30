# Flint cellar improvement backlog

Updated: **2026-09-29**

A working backlog for the current personal-cellar app. Items are proposals, not scheduled commitments. Check an item only after its acceptance criteria are met. Production deployment status still needs verification.

## Direction

Help me choose the right bottle, remember the experience, and buy wines that add something to my collection.

Keep the burgundy-and-cream personality, compact sortable tables, personal 0–100 journal scores, and separate cellar access. Keep discovery adventurous and semi-sweet avoidance editable per person. Personal scores and critic ratings must remain distinct.

## Already implemented in the repository

- Supabase login, separate cellars, account invitations, and managed fridge levels.
- Shared tasting participants, including later additions, with individual scores and comments.
- Cellar Essentials matches for active bottles and personal journal entries; a cellar-specific conversational buyer with online purchase research.
- Personal journal badges, the draggable sommelier, and the evening planner.
- Photo identification with researched bottle images and technical-sheet links.
- My palate preferences, journal evidence, learning controls, and estimated-maturity ranking for AI suggestions.
- All five AI endpoints configured to use `gpt-6-luna`.

These are starting points for improvements below, not features to build again. Wine Heaven/Hell and 1–5 personal ratings are retired. The older [epic list](../flint-cellar-epics.md) is historical context; its commercial/subscription assumptions are outside this backlog.

## Priorities and suggested order

- **P0 — Release verification:** finish before treating the latest release as verified in production.
- **P1 — Next:** highest practical value or a concrete consistency/reliability gap.
- **P2 — Later:** useful additions after the core workflows are dependable.
- **P3 — Explore:** larger or optional investments; validate the need first.

Suggested sequence: **CELLAR-01 → 02 → 03 → 04 → 05 → 06**. Complete the API consistency work in **25** alongside the next AI release. The remaining items can be selected independently unless a dependency is stated.

## Release and wine information

### [ ] CELLAR-01 · Verify the personal-palate release in production

**P0 · Release**

Apply or confirm the palate migration, deploy the current revision, and verify the configured model with real requests.

**Done when:**

- The [palate migration](../supabase/migrations/20260928000000_personal_palate.sql) is present and preferences survive reload and sign-in.
- Both chats, scanning, pairing/meal suggestions, evening planning, and cellar buying complete a live request successfully.
- Two test accounts confirm that cellar membership and personal journal/preferences remain isolated.
- Record the deployment revision, checks, and any unresolved issues. Existing mocked tests alone do not complete this item.

### [ ] CELLAR-02 · Evaluate recommendation quality

**P1 · Sommelier · Depends on 01**

Build a small, repeatable set of realistic requests: dinner pairing, an unfamiliar style, an empty cellar, uncertain sweetness, future drinking windows, and a suitable peak wine competing with a higher-scoring young wine.

**Done when:** answers use available stock, honour explicit constraints, cite real personal evidence, and prefer a suitable maturity tier. Track failures, response time, and usage against an agreed baseline before changing prompts or reasoning settings.

### [ ] CELLAR-03 · Use one maturity rule throughout the app

**P1 · Cellar and AI**

The table/local picks use `utils/cellar.ts`, while personalized AI uses `lib/ai/cellar-context.ts`. Their treatment of past windows and peak estimates differs.

**Done when:** table labels, “Ready to open” counts, local picks, and AI share one tested interpretation of peak, ready, wait, uncertain, and beyond-window wines. Unknown dates and open-ended windows remain explicit; being past a peak does not automatically mean “open urgently.”

### [ ] CELLAR-04 · Record where wine guidance came from

**P1 · Data quality**

Store structured drinking-window and peak ranges, source URL, source vintage, review date, and whether guidance is sourced or estimated. Preserve the existing free-text notes during migration.

**Done when:** details show the evidence behind guidance, conflicting sources are reviewable, another vintage is clearly labelled, and missing information stays unknown. Critic identity, score/range, source, and vintage remain separate from personal ratings.

### [ ] CELLAR-05 · Add a wine-information review queue

**P1 · Data quality · Builds on 04**

Surface missing or contradictory dates, unverified sweetness, broken images/sheets, and uncertain wine identities in one place.

**Done when:** the owner can research one wine, compare proposed changes field by field, accept selected changes, and retain existing values elsewhere. Research cannot silently overwrite stock, journal entries, or personal scores. Confirmed sweetness is structured rather than inferred from grape alone.

## Buying and exploration

### [ ] CELLAR-06 · Recommend purchases that complement the cellar

**P1 · Buying guidance · Builds on 02 and 04**

**Progress (2026-09-29):** cellar-specific gap analysis, permitted personal context, conversational shopping preferences and sourced product cards are implemented; live research quality is unverified. Expand planning for ready-to-drink balance and pairing needs.

Extend the existing Essentials shopping list with personal reasons to buy: unfamiliar styles, favourites with no remaining stock, pairing gaps, and an imbalance between ready and long-term bottles.

**Done when:** each suggestion explains its contribution, existing overlap, relevant taste evidence, and an estimated drinking horizon. Link exact retailer products/vintages and dated availability evidence, including LCBO and Cellar Collection when relevant. Explicit dislikes take precedence; recommending no purchase is valid.

### [ ] CELLAR-07 · Turn shopping suggestions into a personal wishlist

**P1 · Buying workflow**

Save a wine or style with a reason, desired quantity, retailer link, and optional budget.

**Done when:** users can mark an item as considered, shortlisted, purchased, or dismissed. “Purchased” opens a prefilled add-wine review; it does not silently alter stock. Buying or dismissing a suggestion does not become a taste score.

### [ ] CELLAR-08 · Cover the remaining Essentials with shopping options

**P2 · Exploration**

**Progress (2026-09-29):** the buyer can research all 39 existing Essentials across red, white, sparkling, rosé, dry fortified and sweet categories. Live quality across categories still needs checking. Orange wine is not currently an Essential; adding it would require a guide definition and matching rules.

**Done when:** missing styles have researched options or an honest “no verified option found.” The guide distinguishes never tasted, tasted but not stocked, and currently stocked; it does not imply every style must be purchased.

### [ ] CELLAR-09 · Show freshness of retailer information

**P2 · Buying workflow**

**Progress (2026-09-29):** conversational results show research timestamps and availability uncertainty; a follow-up can request fresh research. Persistent saved options, stale-data labels and a dedicated refresh action remain to be built.

**Done when:** price and availability changes are dated and visible, vintage substitutions require review, and unavailable products have a clear state. Any future background notifications are separately enabled by the user.

## Inventory and storage

### [ ] CELLAR-10 · Make accidental consumption and deletion recoverable

**P1 · Inventory integrity**

Add a controlled correction workflow and an activity history recording what changed and who changed it.

**Done when:** undo restores the correct quantity and location atomically, handles concurrent edits, and explains the effect on participants, reviews, and badges. It never silently discards another person’s tasting review or overwrites later stock movements.

### [ ] CELLAR-11 · Detect possible duplicates while adding wine

**P1 · Add wine**

Match producer, cuvée, vintage, and bottle size before saving a manual or scanned addition.

**Done when:** the user can add to existing stock or keep a separate lot. Similar labels and different vintages are never automatically merged. Existing internal IDs and journal references remain stable.

### [ ] CELLAR-12 · Track lots and individual bottle placement

**P2 · Inventory model**

Support bottles of the same wine/vintage stored on different shelves or acquired on different dates, with optional purchase details and bottle size.

**Done when:** a wine groups its lots without losing their quantities, consumption identifies the lot used, and existing records migrate without duplication or broken journal links. Quantity totals agree in every view.

### [ ] CELLAR-13 · Add fridge capacity and a shelf overview

**P2 · Storage · Multiple-location support builds on 12**

Extend the existing named fridges and levels with optional capacity and a compact view of their contents.

**Done when:** the owner can set capacity, see occupancy, filter wines by shelf, and move selected stock with confirmation. Capacity warnings account for quantity and available bottle-size information. Existing level names and assignments are preserved.

### [ ] CELLAR-14 · Support safe bulk edits

**P2 · Inventory workflow**

Select several wines to move shelves or correct shared metadata.

**Done when:** a preview lists affected records and fields, unauthorized records cannot be changed, failures are clear, and stock/journal changes cannot be triggered accidentally by a metadata edit.

### [ ] CELLAR-15 · Add export and recovery tools

**P1 · Data ownership**

Provide downloadable inventory and personal-journal exports, plus a documented backup/restore procedure.

**Done when:** exports preserve stable identifiers, quantities, dates, sources, and the acting user’s ratings. They exclude other users’ private reviews and preferences. A restore rehearsal on test data preserves relationships and rejects duplicates or cross-cellar assignments.

### [ ] CELLAR-16 · Improve opened-bottle and Coravin tracking

**P2 · Everyday use**

Build on the existing Coravin flag/date with opening date, preservation method, remaining amount, and personal condition notes.

**Done when:** partially opened bottles have a useful filter and clearly distinguished guidance. A Coravin access does not automatically count as a finished bottle or earn a consumption badge. Preservation estimates do not guarantee condition.

## Journal, palate, and shared tastings

### [ ] CELLAR-17 · Store tasting feedback as structured fields

**P1 · Personalization**

Replace learning rules that depend on exact comment lines with explicit flags for faulty, too young, too sweet, too oaky, and would buy again.

**Done when:** editing prose or switching language cannot accidentally change learning eligibility. Existing comments are preserved; exact legacy quick-note markers can be migrated, while ambiguous free text requires review.

### [ ] CELLAR-18 · Add a tasting-session view

**P2 · Journal**

Group several consumed wines into one dinner or tasting with a date, optional meal, and participants.

**Done when:** wines retain independent stock transactions and personal scores, later participant additions remain possible, and each user sees only the session/review information they are allowed to access.

### [ ] CELLAR-19 · Complete the invitation and access lifecycle

**P1 · Shared cellars**

Extend the existing People dialog with clear invitation status, resend/cancel actions, and removal of ongoing cellar access.

**Done when:** owners can see pending versus active membership and remove access safely. Define historical tasting visibility explicitly; access removal does not erase someone’s personal review without a deliberate policy and workflow. Prevent orphaning a cellar with no owner.

### [ ] CELLAR-20 · Make journal comparisons more useful

**P2 · Journal**

Compare personal tastings of the same wine across vintages or dates, and show how preferences evolve.

**Done when:** the comparison includes score, comments, tasting date, and recorded condition. Single tastings and small samples remain labelled as limited evidence. Repeated tastings do not inflate confidence.

### [ ] CELLAR-21 · Add discovery journeys around existing badges

**P2 · Personality and exploration**

Create optional paths such as “Northern Rhône to Barossa” or “Three faces of Sangiovese,” using existing Essential matches and journal badges.

**Done when:** progress comes from real personal tastings, each step explains what to notice, and the next step can use a bottle already owned. No streaks or rewards depend on drinking frequency or quantity. Brunello and Super Tuscan remain distinct categories.

## Sommelier and interface

### [ ] CELLAR-22 · Keep a conversation when switching chat views

**P2 · Sommelier experience**

Let the floating assistant and full-page chat share the same conversation, with clear restart and history controls.

**Done when:** switching views preserves context, switching users/cellars does not leak it, and stock/evidence are revalidated for each request. Disabling journal learning prevents old generated journal citations from being reintroduced as fresh AI context.

### [ ] CELLAR-23 · Save useful table views and simplify mobile actions

**P2 · Interface**

Remember filters, column choices, and sorting per user/cellar; provide shortcuts such as peak bottles, a particular fridge, or unrated journal entries.

**Done when:** refresh and back navigation preserve the selected view; reset is obvious. Phone layouts keep wine identity and the primary action accessible. Preserve page scrolling, keyboard sorting, visible focus, and the compact desktop table.

### [ ] CELLAR-24 · Add a concise cellar outlook

**P2 · Planning · Depends on 03 and benefits from 04**

Show bottles near estimated peak, future drinking coverage, and a small set of personal exploration opportunities.

**Done when:** summaries derive from real stock and supported date ranges, count bottles correctly, disclose unknown maturity, and link to filtered table views. The outlook stays compact enough that the collection remains the main page’s focus.

## Reliability and future architecture

### [ ] CELLAR-25 · Standardize AI endpoint validation and usage controls

**P1 · Reliability**

Bring pairing enrichment to the same explicit session/origin/input-validation standard as the other AI handlers. Add shared durable request limits and operational measurements across all five endpoints.

**Done when:** handlers validate access independently of middleware, bound input/output, and fail predictably on quota, timeout, or malformed output. Measure feature, model, latency, token usage, and failure category without logging photos, private comments, or keys. Repeated clicks do not cause uncontrolled duplicate requests.

### [ ] CELLAR-26 · Add repeatable release checks and refresh project documentation

**P1 · Maintenance**

Use a dedicated test environment to exercise login, invitations, add/scan, partial consumption, later sharing, reviews, fridges, and palate changes end to end.

**Done when:** releases have a repeatable smoke checklist, a migration/rollback record, and representative desktop/mobile coverage. Fixtures are clearly separate from production. Update stale design and epic documentation so retired workflows and old colour guidance are not mistaken for current requirements.

### [ ] CELLAR-27 · Support larger cellars with targeted retrieval

**P3 · Sommelier architecture · Depends on 02**

Replace the current bounded inventory/journal snapshot when real cellar size or quality measurements justify it. Retrieve candidates for the requested food, maturity, style, and preferences before generating a reply.

**Done when:** relevant wines beyond the current 80-candidate limit can be found, all retrieval remains account/cellar scoped, and evaluation shows preserved or improved quality at acceptable latency. Introduce tools or document search only for a measured need; a separate hosted agent is not a prerequisite.

### [ ] CELLAR-28 · Explore shared-dinner recommendations

**P3 · Social sommelier**

Find a bottle for selected participants using only preferences each person chooses to share.

**Done when:** participants control participation and shared fields, the recommendation explains compromises without revealing private notes, and the owner cannot access private profiles simply by owning the cellar. Dietary constraints and suitable maturity still take precedence.

## Reference material

- [Current AI integrations and API map](ai-integrations.md)
- [My palate setup, privacy, and selection rules](my-palate.md)
- [Longer-term sommelier plan](plans/cellar-aware-sommelier.md)
- [Supabase setup and migrations](../supabase/README.md)
- [Red Essentials retailer research](research/red-essentials-lcbo-2026-09-24.md)

When selecting an item for implementation, confirm scope, add necessary schema changes and checks, update this file, and distinguish repository completion from verified production rollout.
