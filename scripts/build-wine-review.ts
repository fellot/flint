// Render the reviewed data into standalone Supabase scripts and a readable report.
// No network access and no database writes: the JSON holds the research decisions.
import { readFileSync, writeFileSync } from 'node:fs';

const base = 'supabase/reviews/20260917-wine-audit';
const audit = JSON.parse(readFileSync(`${base}.json`, 'utf8'));
const fields = ['drinking_window', 'peak_year', 'food_pairing_notes', 'meal_suggestion'] as const;
const labels = { drinking_window: 'Drinking window', peak_year: 'Peak year (estimated)', food_pairing_notes: 'Food pairing notes', meal_suggestion: 'Suggested meal' };
type Field = typeof fields[number];
type Original = Record<Field, string> & { id: string; cellar_id: string; bottle: string; vintage: number; quantity: number };
type Review = { original: Original; changes: Partial<Record<Field, string>>; reasoning: Record<Field, string>; sources: { title: string; url: string }[]; identity_flag: string | null };
const rows: Review[] = audit.wines;
const pick = (r: Review, keys: string[]) => Object.fromEntries(keys.map(k => [k, r.original[k as Field]]));

function sql(undo: boolean) {
  const action = undo ? 'Restore' : 'Apply';
  const payload = rows.map(r => ({
    cellar_id: r.original.cellar_id, id: r.original.id, bottle: r.original.bottle, vintage: r.original.vintage,
    expected: undo ? r.changes : pick(r, Object.keys(r.changes)),
    proposed: undo ? pick(r, Object.keys(r.changes)) : r.changes,
    identity_flag: r.identity_flag,
  }));
  const json = JSON.stringify(payload, null, 2);
  if (json.includes('$review_data$')) throw new Error('Unexpected SQL delimiter in input');
  return `-- Flint: ${action.toLowerCase()} wine recommendation review, 2026-09-17.
-- Run the WHOLE file in Supabase > SQL Editor. No CLI or application deployment needed.
-- Source: the user's current export, 29 wines in cellar 1.
-- Read 20260917-wine-audit.md for reasons, sources, uncertainty and label checks.
-- Only drinking_window, peak_year, food_pairing_notes and meal_suggestion can change.
-- Peak years and some window bounds are planning estimates, not verified facts.
-- ${undo ? 'Restores only the fields changed by the paired apply script, while the row remains in the cellar.' : 'Applies the reviewed factual corrections AND the clearly documented planning/culinary refinements.'}
-- Missing, consumed, sold, gifted and zero-stock records are skipped.
-- Changed identities or conflicting edits to a target field abort the whole transaction.
-- Rerunning is safe: already matching fields are not updated. updated_at uses the existing trigger.

begin;
set local standard_conforming_strings = on;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create temporary table flint_wine_review (
  cellar_id text not null check (cellar_id = '1'), id text not null,
  bottle text not null, vintage integer not null,
  expected jsonb not null, proposed jsonb not null, identity_flag text,
  primary key (cellar_id, id)
) on commit drop;

insert into flint_wine_review
select * from jsonb_to_recordset($review_data$
${json}
$review_data$::jsonb) as r(
  cellar_id text, id text, bottle text, vintage integer,
  expected jsonb, proposed jsonb, identity_flag text
);

-- Lock the known records before comparing values so concurrent edits cannot be lost.
do $lock_rows$
begin
  perform w.id from public.wines w
  join flint_wine_review r on r.cellar_id = w.cellar_id and r.id = w.id
  order by w.cellar_id, w.id for update of w;
end
$lock_rows$;

create temporary table flint_wine_review_plan on commit drop as
select r.*, to_jsonb(w) as current_row,
  case
    when w.id is null then 'skipped: record missing'
    when w.status <> 'in_cellar' or w.quantity <= 0 then 'skipped: no longer in stock'
    when (w.bottle, w.vintage) is distinct from (r.bottle, r.vintage) then 'conflict: identity changed'
    when r.identity_flag is not null then 'unchanged: confirm bottle label'
    when r.proposed = '{}'::jsonb then 'unchanged: reviewed'
    when exists (
      select 1 from jsonb_each(r.proposed) f
      where (to_jsonb(w) -> f.key) is distinct from (r.expected -> f.key)
        and (to_jsonb(w) -> f.key) is distinct from f.value
    ) then 'conflict: recommendation edited'
    when not exists (
      select 1 from jsonb_each(r.proposed) f
      where (to_jsonb(w) -> f.key) is distinct from f.value
    ) then 'unchanged: already matches'
    else 'ready'
  end as outcome
from flint_wine_review r
left join public.wines w on w.cellar_id = r.cellar_id and w.id = r.id;

do $guard$
declare conflicts text;
begin
  select string_agg(id || ' (' || bottle || '): ' || outcome, '; ' order by id)
  into conflicts from flint_wine_review_plan where outcome like 'conflict:%';
  if conflicts is not null then
    raise exception 'Review stopped; no changes committed. Re-export these records for review: %', conflicts;
  end if;
end
$guard$;

create temporary table flint_wine_review_changed on commit drop as
with changed as (
  update public.wines w set
${fields.map(f => `    ${f} = case when p.proposed ? '${f}' then p.proposed ->> '${f}' else w.${f} end`).join(',\n')}
  from flint_wine_review_plan p
  where p.outcome = 'ready' and w.cellar_id = p.cellar_id and w.id = p.id
    and w.status = 'in_cellar' and w.quantity > 0
  returning w.cellar_id, w.id
)
select * from changed;

-- Final result includes every reviewed wine and any newly added, unreviewed wine.
select p.id, p.bottle, p.vintage,
  case when c.id is not null then '${undo ? 'restored' : 'updated'}' else p.outcome end as result,
  case when p.proposed <> '{}'::jsonb then p.expected else null end as expected_before,
  case when p.proposed <> '{}'::jsonb then p.proposed else null end as proposed_after,
  p.identity_flag as attention,
  (select count(*) from flint_wine_review_changed) as total_rows_changed
from flint_wine_review_plan p
left join flint_wine_review_changed c using (cellar_id, id)
union all
select w.id, w.bottle, w.vintage, 'unreviewed: added since export', null::jsonb, null::jsonb,
  'This wine needs a separate review.', (select count(*) from flint_wine_review_changed)
from public.wines w
where w.cellar_id = '1' and w.status = 'in_cellar' and w.quantity > 0
  and not exists (select 1 from flint_wine_review r where r.cellar_id = w.cellar_id and r.id = w.id)
order by bottle, vintage;

commit;
`;
}

const changed = rows.filter(r => Object.keys(r.changes).length);
const windowChanges = rows.filter(r => r.changes.drinking_window);
const esc = (s: unknown) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
let report = `# Flint cellar wine review — 17 September 2026

Reviewed all **${rows.length} wine records / ${rows.reduce((n,r) => n + r.original.quantity, 0)} bottles** in the Supabase export supplied by you, restricted to cellar **1** and positive stock. The export supersedes the old repository inventory. All exported bottles have Coravin set to false.

**Result: ${changed.length} records have proposed changes; ${rows.length-changed.length} are left unchanged, including three needing label confirmation.** ${windowChanges.length} drinking windows and ${rows.filter(r => r.changes.peak_year).length} peak targets change. Most meals were already suitable.

## How to interpret the review

- **Windows are estimates, not expiry dates.** They assume a sound, unopened bottle, roughly 750 ml, consistently cool storage, and no heat damage. The export does not establish bottle size, provenance, temperature history or condition.
- **No exact peak year was independently established.** Existing and proposed peaks are planning targets. They reflect an enjoyment stage rather than a measurable date. New mature-style targets are explicitly identified as estimates below; a wine may also be enjoyable young.
- **Sources disagree.** Where an existing range remains defensible, it is generally retained. “Retain provisionally” means there was insufficient evidence for a correction, not that every date was verified.
- **Pairings are culinary judgments.** Producer and vintage-specific descriptions establish the wine's profile; the dish matching is my reasoned inference unless a producer explicitly recommends it. Sweet sauces can make a dry wine seem less fruity and more bitter; salt and fat often soften the impression of tannin. These principles explain the two meal refinements. [WSET: pairing essentials](https://www.wsetglobal.com/knowledge-centre/blog/2023/july/13/four-rules-to-masterful-food-and-wine-pairing), [WSET: sweetness and wine](https://www.wsetglobal.com/knowledge-centre/blog/2020/december/21/winter-wine-and-food-matching).
- **Only four fields are changed.** Quantities, locations, wine identities, grapes, technical-sheet URLs, personal comments, scores and journals are preserved. Related metadata issues are called out below. The database's normal updated_at trigger still records the update.

## Apply the changes

1. Open [20260917-wine-audit.sql](20260917-wine-audit.sql), copy its entire contents into **Supabase → SQL Editor → New query**, and run it in your Flint project.
2. Check the result column. With the unchanged export, expect **${changed.length} updated records**. Missing or no-longer-stocked wines are skipped; the three identity questions are reported without edits. New wines are reported as unreviewed.
3. Refresh Flint. No app deployment or environment-variable change is needed.

The script includes both factual corrections and the planning/culinary refinements explained here. It checks the current bottle identity and each field it intends to change. A conflicting manual edit aborts the whole transaction rather than overwriting it. Unrelated fields can have changed safely. Rerunning produces no duplicate changes. If Supabase reports a conflict, re-export those rows instead of removing the guard. If a transaction remains open after an error, run ROLLBACK before trying again.

The paired [rollback script](20260917-wine-audit.rollback.sql) restores only the modified recommendation fields on matching, still-in-stock records. It also refuses to overwrite later conflicting edits. It does not restore old timestamps or modify journal records. The [audit JSON](20260917-wine-audit.json) preserves the supplied export and research decisions.

## Changes to drinking windows

| Wine | Previous window | Proposed window | Peak target |
| --- | --- | --- | --- |
${windowChanges.map(r => `| ${esc(r.original.bottle)} (${r.original.vintage}) | ${esc(r.original.drinking_window)} | ${r.changes.drinking_window} | ${r.changes.peak_year ? `${r.original.peak_year} → ${r.changes.peak_year}` : `${r.original.peak_year} retained`} |`).join('\n')}

The detailed entries below identify the evidence and uncertainty for every change. In particular, the new **Lungarotti endpoint**, **Beaucastel later-phase endpoint**, and all new peak targets are estimates; they must not be presented as critic quotations.

## Bottle identities to confirm

${rows.filter(r => r.identity_flag).map(r => `- **${r.original.bottle} (${r.original.vintage}), ID ${r.original.id}:** ${r.identity_flag}`).join('\n')}

These checks do not prevent the other verified identities from receiving their proposed corrections.

## Wine-by-wine findings

`;
rows.forEach((r, i) => {
  report += `### ${i+1}. ${r.original.bottle} — ${r.original.vintage}\n\nID: ${r.original.id}. **${r.identity_flag ? 'Identity unresolved — no changes' : Object.keys(r.changes).length ? 'Changes proposed' : 'No changes proposed'}.**\n\n`;
  for (const f of fields) {
    const change = r.changes[f];
    const status = f === 'drinking_window' || f === 'peak_year'
      ? change ? `${r.original[f]} → ${change}` : `retain ${r.original[f]}`
      : change ? 'revise' : 'retain';
    report += `**${labels[f]} — ${status}.** ${r.reasoning[f]}\n\n`;
    if (change && f !== 'drinking_window' && f !== 'peak_year') report += `Proposed text: ${change}\n\n`;
    if (f === 'meal_suggestion' && !change) report += `Retained meal: ${r.original[f]}\n\n`;
  }
  report += `Sources: ${r.sources.map(s => `[${s.title}](${s.url})`).join('; ')}.\n\n`;
});

writeFileSync(`${base}.sql`, sql(false));
writeFileSync(`${base}.rollback.sql`, sql(true));
writeFileSync(`${base}.md`, report);
console.log(`Generated review and two SQL scripts for ${rows.length} wines; ${changed.length} change rows.`);
