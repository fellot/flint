# Cellar-aware sommelier — future plan

Status: parked by the owner on 2026-09-23. This document records the agreed direction; the architecture is not implemented by the floating-pet change.

## Goal

One personal sommelier for opening bottles, planning the cellar, and researching useful purchases. Prioritize wines in their estimated peak drinking period, respect food and occasion constraints, and learn from each user's own journal. Seasonal food/weather preferences are secondary to maturity.

## Architecture

Flint UI → authenticated Next.js sommelier API → Supabase inventory and personal profile → deterministic maturity/candidate selection → AI reasoning and explanation → validated structured response.

- Keep the service in the existing backend initially. No separate hosted agent or fine-tuning is needed for the first version.
- Read live inventory on the server after verifying cellar membership. Never trust a browser-provided wine list or model-selected user identity.
- Use the OpenAI Responses API and narrowly scoped tools for cellar candidates, personal preferences, and purchase research. The backend owns access control and tool execution.
- Share this service between the full chat and the “Tonight, perhaps…” planner.
- Choose a model using representative quality, latency and cost evaluations.

## Maturity-first recommendations

Normalize drinking-window start/end, peak start/end, source, confidence, available quantity, reserved bottles, and opened/Coravin dates. Preserve original guidance when migrating existing free-text fields; do not invent precision or silently classify unknown values.

1. Filter unavailable stock and respect explicit user constraints.
2. Prefer suitable wines in their best-supported estimated peak period.
3. Within that group, consider taste and pairing fit.
4. Offer ready wines outside the peak group when necessary, explaining the compromise.
5. List potentially declining wines separately as “Check these soon.” A peak estimate is not an expiry date.

## Personal memory

Store explicit preferences, inferred preferences, evidence and confidence in Supabase. Use 0–100 journal scores, comments and direct recommendation feedback; ownership or consumption alone does not imply liking a wine. Make the profile editable and resettable.

Keep each user's profile separate from shared cellar stock. Shared-dinner mode may use the selected participants' permitted preferences. Avoid sending unrelated private notes or other users' journal entries to the provider.

For a small cellar, send a compact fresh inventory snapshot. For larger inventories, shortlist using structured database queries. Document retrieval can support technical sheets and research, while stock and dates stay in the database.

## Buying guidance

Find a reason to buy before looking up products: favourites running low, a shortage of ready-to-drink bottles, missing occasions/pairings, sensible exploration, or gaps in future drinking periods. Incorporate the user's budget, shopping region, retailers and cellar goals.

Research exact wines and vintages using producer/retailer evidence. Show why the wine fits the user's taste, what it adds, overlap with existing stock, drinking horizon, source links and the date availability was checked. Never fabricate stock, prices or scores. “You already cover this well” is a valid answer. No automatic purchase flow.

## Prompt policy

Recommend from verified available inventory for drinking requests. Respect explicit constraints, then prioritize the best-supported peak-maturity group. Use only the authenticated user's permitted preference and journal evidence. Distinguish sourced facts, estimates and creative suggestions. Explain the choice and alternatives. Identify a cellar need before researching purchases. Never invent stock, vintages, ratings or sources.

Enforce inventory, access and output validation in code rather than relying on the prompt alone. Treat user-supplied notes and retrieved documents as data, not system instructions.

## Delivery phases and validation

1. Live authorized inventory, typed output, reliable maturity selection; tests for consumed/zero stock, uncertain dates, unsuitable peak wines and cross-cellar access.
2. Editable personal memory and feedback; tests for user separation, weak evidence and explicit preference overrides.
3. Cellar-gap analysis and sourced buying advice; tests for vintage mismatches, missing retailer evidence, stale stock and unnecessary duplication.

Evaluate recommendations on real representative scenarios before choosing model defaults. Keep recommendation history separate from confirmed taste preferences; refresh cached profiles after reviews and explicit preference edits.

## References

- [Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Web search](https://developers.openai.com/api/docs/guides/tools-web-search)
