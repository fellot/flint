-- Run after 20260928000000_personal_palate.sql in Supabase SQL Editor.
-- Safe to rerun. Existing preferences, reviews and cellar access are preserved.
begin;

create or replace function public.valid_grape_preferences(value jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare entry jsonb; seen text[] := '{}'; grape_id text;
begin
  if value is null or jsonb_typeof(value) <> 'array' then return false; end if;
  if jsonb_array_length(value) > 40 then return false; end if;
  for entry in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(entry) <> 'object' then return false; end if;
    if not (entry ?& array['grapeId', 'preference', 'notes'])
      or (entry - array['grapeId', 'preference', 'notes']) <> '{}'::jsonb then return false; end if;
    if jsonb_typeof(entry->'grapeId') <> 'string'
      or jsonb_typeof(entry->'preference') <> 'string'
      or jsonb_typeof(entry->'notes') <> 'string' then return false; end if;
    grape_id := entry->>'grapeId';
    if grape_id = any(seen) or grape_id <> all(array['aglianico', 'albarino', 'alicante-bouschet', 'arneis', 'assyrtiko', 'barbera', 'blaufrankisch', 'bobal', 'cabernet-franc', 'cabernet-sauvignon', 'canaiolo', 'carignan', 'carmenere', 'carricante', 'chardonnay', 'chenin-blanc', 'cinsault', 'cortese', 'corvina', 'dolcetto', 'fiano', 'furmint', 'gamay', 'garganega', 'gewurztraminer', 'glera', 'godello', 'graciano', 'greco', 'grenache', 'grenache-blanc', 'gruner-veltliner', 'malbec', 'malvazija-istarska', 'mammolo', 'marsanne', 'mencia', 'merlot', 'mourvedre', 'muscadelle', 'muscat-blanc', 'nebbiolo', 'negroamaro', 'nerello-mascalese', 'nero-davola', 'palomino', 'pedro-ximenez', 'petit-verdot', 'petite-sirah', 'pinot-blanc', 'pinot-gris', 'pinot-meunier', 'pinot-noir', 'pinotage', 'riesling', 'roussanne', 'sagrantino', 'sangiovese', 'sauvignon-blanc', 'savagnin', 'semillon', 'syrah', 'tannat', 'tempranillo', 'tinta-barroca', 'touriga-franca', 'touriga-nacional', 'trebbiano-toscano', 'verdejo', 'verdicchio', 'vermentino', 'vidal', 'viognier', 'viura', 'xinomavro', 'zinfandel', 'zweigelt']) then return false; end if;
    if entry->>'preference' not in ('love', 'like', 'neutral', 'avoid', 'explore')
      or length(entry->>'notes') > 240 then return false; end if;
    seen := array_append(seen, grape_id);
  end loop;
  return true;
end;
$$;
revoke all on function public.valid_grape_preferences(jsonb) from public;
grant execute on function public.valid_grape_preferences(jsonb) to authenticated, service_role;

alter table public.palate_preferences
  add column if not exists grape_preferences jsonb not null default '[]'::jsonb;
alter table public.palate_preferences drop constraint if exists palate_grape_preferences_valid;
alter table public.palate_preferences add constraint palate_grape_preferences_valid
  check (public.valid_grape_preferences(grape_preferences));

-- Existing table RLS continues to restrict every field to auth.uid().
comment on column public.palate_preferences.grape_preferences is
  'Explicit personal grape labels and notes. Journal evidence is computed, never saved here.';
notify pgrst, 'reload schema';
commit;
