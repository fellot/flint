-- Read-only. Run in Supabase > SQL Editor > New query, then copy the JSON result.
-- Uses the existing Felipe/cellar assignment. Edit these two values if needed.
-- No emails, account IDs, other people's reviews, or prices appear in the export.
with
params as (
  select '1'::text as cellar_id,
         'felipeloturco@gmail.com'::text as account_email
),
matched_person as (
  select p.id as person_id, p.cellar_id
  from params cfg
  join auth.users u on lower(u.email) = lower(trim(cfg.account_email))
  join public.cellar_members m
    on m.user_id = u.id and m.cellar_id = cfg.cellar_id
  join public.cellar_people p
    on p.user_id = u.id and p.cellar_id = m.cellar_id
),
me as (
  select * from matched_person
  where (select count(*) from matched_person) = 1
),
active as (
  select w.id, w.bottle, w.vintage, w.style, w.grapes,
         w.country, w.region, w.quantity, w.drinking_window,
         w.peak_year, w.technical_sheet_url
  from public.wines w
  join me on me.cellar_id = w.cellar_id
  where w.status = 'in_cellar' and w.quantity > 0
),
journal as (
  select w.id, w.bottle, w.vintage, w.style, w.grapes,
         w.country, w.region, w.quantity as bottles_consumed,
         w.consumed_date, w.from_cellar, w.technical_sheet_url,
         r.rating as my_score_0_100, r.comment as my_comment,
         r.updated_at as review_updated_at
  from me
  join public.wine_participants t
    on t.cellar_id = me.cellar_id and t.person_id = me.person_id
  join public.wines w
    on w.cellar_id = t.cellar_id and w.id = t.wine_id
  left join public.wine_reviews r
    on r.cellar_id = t.cellar_id and r.wine_id = t.wine_id
    and r.person_id = t.person_id
  where w.status = 'consumed'
)
select jsonb_pretty(jsonb_build_object(
  'exported_at', current_timestamp,
  'status', case when (select count(*) from matched_person) = 1
    then 'OK'
    else 'CHECK ACCOUNT EMAIL / CELLAR ID: no unique member profile matched'
    end,
  'cellar_name', (select c.name from public.cellars c join me on me.cellar_id = c.id),
  'counts', jsonb_build_object(
    'active_wine_rows', (select count(*) from active),
    'active_bottles', (select coalesce(sum(quantity), 0) from active),
    'journal_entries', (select count(*) from journal),
    'scored_journal_entries', (select count(my_score_0_100) from journal)
  ),
  'active_wines', coalesce(
    (select jsonb_agg(to_jsonb(a) order by a.style, a.country, a.bottle, a.vintage, a.id) from active a),
    '[]'::jsonb
  ),
  'my_journal', coalesce(
    (select jsonb_agg(to_jsonb(j) order by j.consumed_date desc nulls last, j.bottle, j.id) from journal j),
    '[]'::jsonb
  )
)) as exploration_export;
