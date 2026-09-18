-- Run after 20260916020000_managed_wine_fridges.sql.
-- Felipe's Wine Cellar A and Wine Fridge A are the same physical fridge.
-- Keep each CURRENT level unchanged. This does NOT repeat the earlier level shift.
begin;
lock table public.cellar_fridges, public.cellar_storage_locations, public.wines in share row exclusive mode;

do $$
declare
  target_id uuid;
  first_n integer;
  last_n integer;
begin
  create temporary table merge_fridge_a_sources on commit drop as
    select * from public.cellar_fridges where cellar_id = '1'
    and lower(regexp_replace(trim(name), '\s+', ' ', 'g')) in ('wine cellar a', 'wine fridge a');
  create temporary table merge_fridge_a_locations on commit drop as
    select label old_label,
      case when level is not null then level
        when label ~* '^\s*Wine\s+(Cellar|Fridge)\s+A\s*-\s*L\s*[0-9]{1,2}\s*$'
          then (regexp_match(label, 'L\s*([0-9]{1,2})\s*$', 'i'))[1]::integer
        else null end shelf,
      regexp_replace(label, '^\s*Wine\s+(Cellar|Fridge)\s+A\s*', 'Wine Fridge A', 'i') new_label
    from public.cellar_storage_locations where cellar_id = '1'
    and (fridge_id in (select id from merge_fridge_a_sources)
      or label ~* '^\s*Wine\s+(Cellar|Fridge)\s+A(\s*-|\s*$)');
  if not exists (select 1 from merge_fridge_a_sources) and not exists (select 1 from merge_fridge_a_locations) then return; end if;

  -- Prefer the existing canonical fridge's identity; otherwise keep the alias ID.
  select id into target_id from merge_fridge_a_sources
    order by (lower(trim(name)) = 'wine fridge a') desc, id limit 1;
  if target_id is null then
    insert into public.cellar_fridges (cellar_id, name, level_count, first_level)
      values ('1', 'Wine Fridge A', 7, 1) returning id into target_id;
  end if;
  select least(1, coalesce(min(n), 1)), greatest(7, coalesce(max(n), 7)) into first_n, last_n from (
    select first_level n from merge_fridge_a_sources
    union all select first_level + level_count - 1 from merge_fridge_a_sources
    union all select shelf from merge_fridge_a_locations where shelf is not null
  ) bounds;
  if first_n < 0 or last_n - first_n + 1 > 50 then
    raise exception 'The combined fridge exceeds 50 levels. No locations were changed.';
  end if;
  update merge_fridge_a_locations set new_label = 'Wine Fridge A - L' || shelf where shelf is not null;
  -- Preserve unusual/multi-level descriptions as named legacy options too.
  update merge_fridge_a_locations set new_label = regexp_replace(new_label, '^Wine Fridge A-', 'Wine Fridge A -');

  -- Release old slot identities while retaining the labels referenced by wines.
  update public.cellar_storage_locations set fridge_id = null, level = null
    where cellar_id = '1' and label in (select old_label from merge_fridge_a_locations);
  insert into public.cellar_storage_locations (cellar_id, label, fridge_id, level)
    select '1', 'Wine Fridge A - L' || n, target_id, n from generate_series(first_n, last_n) n
    on conflict (cellar_id, label) do update set fridge_id = excluded.fridge_id, level = excluded.level;
  insert into public.cellar_storage_locations (cellar_id, label)
    select distinct '1', new_label from merge_fridge_a_locations on conflict do nothing;

  update public.wines w set location = m.new_label from merge_fridge_a_locations m
    where w.cellar_id = '1' and w.location = m.old_label and m.old_label <> m.new_label;
  delete from public.cellar_storage_locations where cellar_id = '1'
    and label in (select old_label from merge_fridge_a_locations where old_label <> new_label);
  delete from public.cellar_fridges where id in (select id from merge_fridge_a_sources) and id <> target_id;
  update public.cellar_fridges set name = 'Wine Fridge A', first_level = first_n, level_count = last_n - first_n + 1 where id = target_id;
end $$;
commit;
