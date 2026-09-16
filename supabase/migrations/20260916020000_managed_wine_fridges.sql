-- Run after the people/journals migrations. Existing locations are preserved.
begin;

create table if not exists public.cellar_fridges (
  id uuid primary key default gen_random_uuid(),
  cellar_id text not null references public.cellars(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  level_count integer not null check (level_count between 1 and 50),
  first_level integer not null default 1 check (first_level in (0, 1)),
  unique (cellar_id, id)
);
create unique index if not exists cellar_fridges_name_idx on public.cellar_fridges (cellar_id, lower(name));
create table if not exists public.cellar_storage_locations (
  cellar_id text not null references public.cellars(id) on delete cascade,
  label text not null,
  fridge_id uuid,
  level integer,
  primary key (cellar_id, label),
  foreign key (cellar_id, fridge_id) references public.cellar_fridges(cellar_id, id) on delete cascade,
  unique (fridge_id, level),
  check ((fridge_id is null and level is null) or (fridge_id is not null and level is not null and level between 0 and 50))
);

do $$ begin
if not exists (select 1 from pg_constraint where conname = 'wines_storage_location_fkey' and conrelid = 'public.wines'::regclass) then
-- Shift Felipe's existing Wine Fridge A levels once, including L6 -> L7.
-- This runs before the storage FK is installed, and is skipped on subsequent runs.
with original as (
  select id, regexp_match(location, '^(.+?)\s*-\s*L\s*([0-9]{1,2})$', 'i') parts
  from public.wines where cellar_id = '1'
)
update public.wines w set location = 'Wine Fridge A - L' || (original.parts[2]::integer + 1)
  from original where w.cellar_id = '1' and w.id = original.id
  and lower(trim(original.parts[1])) = 'wine fridge a' and original.parts[2]::integer between 0 and 6;

-- Register legacy free text first, so unusual locations are never lost.
insert into public.cellar_storage_locations (cellar_id, label)
  select id, '' from public.cellars on conflict do nothing;
insert into public.cellar_storage_locations (cellar_id, label)
  select distinct cellar_id, location from public.wines on conflict do nothing;

-- Recognize single-level labels, including casing and spacing variations.
-- Multi-level descriptions remain under Other existing locations for manual placement.
with parsed as (
  select cellar_id, regexp_match(location, '^(.+?)\s*-\s*L\s*([0-9]{1,2})$', 'i') parts
  from public.wines where location <> ''
), grouped as (
  select cellar_id, min(trim(parts[1])) name, min(parts[2]::integer) low, max(parts[2]::integer) high
  from parsed where parts is not null and parts[2]::integer <= 50
  group by cellar_id, lower(trim(parts[1]))
)
insert into public.cellar_fridges (cellar_id, name, first_level, level_count)
  select cellar_id, name,
    case when cellar_id = '1' and lower(name) = 'wine fridge a' then 1 when low = 0 then 0 else 1 end,
    case when cellar_id = '1' and lower(name) = 'wine fridge a' then 7 when low = 0 then least(high + 1, 50) else greatest(high, 1) end
  from grouped on conflict do nothing;
insert into public.cellar_fridges (cellar_id, name, first_level, level_count)
  select id, 'Wine Fridge A', 1, 7 from public.cellars where id = '1' on conflict do nothing;

insert into public.cellar_storage_locations (cellar_id, label, fridge_id, level)
  select f.cellar_id, f.name || ' - L' || n, f.id, n
  from public.cellar_fridges f cross join lateral generate_series(f.first_level, f.first_level + f.level_count - 1) n
  on conflict (cellar_id, label) do update set fridge_id = excluded.fridge_id, level = excluded.level
  where cellar_storage_locations.fridge_id is null;
with parsed as (
  select cellar_id, id, regexp_match(location, '^(.+?)\s*-\s*L\s*([0-9]{1,2})$', 'i') parts from public.wines
)
update public.wines w set location = l.label
  from parsed p join public.cellar_fridges f on f.cellar_id = p.cellar_id and lower(f.name) = lower(trim(p.parts[1]))
  join public.cellar_storage_locations l on l.fridge_id = f.id and l.level = p.parts[2]::integer
  where w.cellar_id = p.cellar_id and w.id = p.id and w.location <> l.label;
delete from public.cellar_storage_locations l where l.fridge_id is null and l.label <> ''
  and not exists (select 1 from public.wines w where w.cellar_id = l.cellar_id and w.location = l.label);

end if;
end $$;

-- A composite key prevents assigning wines to a different cellar's locations.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'wines_storage_location_fkey' and conrelid = 'public.wines'::regclass) then
    alter table public.wines add constraint wines_storage_location_fkey
      foreign key (cellar_id, location) references public.cellar_storage_locations(cellar_id, label)
      on update cascade on delete restrict;
  end if;
end $$;

create or replace function public.initialize_cellar_storage() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.cellar_storage_locations (cellar_id, label) values (new.id, '') on conflict do nothing;
  return new;
end $$;
drop trigger if exists initialize_cellar_storage on public.cellars;
create trigger initialize_cellar_storage after insert on public.cellars for each row execute function public.initialize_cellar_storage();
revoke all on function public.initialize_cellar_storage() from public, anon, authenticated;

alter table public.cellar_fridges enable row level security;
alter table public.cellar_storage_locations enable row level security;
revoke all on public.cellar_fridges, public.cellar_storage_locations from anon, authenticated;
grant select on public.cellar_fridges, public.cellar_storage_locations to authenticated;
grant all on public.cellar_fridges, public.cellar_storage_locations to service_role;
drop policy if exists "Read cellar fridges" on public.cellar_fridges;
create policy "Read cellar fridges" on public.cellar_fridges for select to authenticated
  using (cellar_id in (select cellar_id from public.cellar_members where user_id = (select auth.uid())));
drop policy if exists "Read cellar locations" on public.cellar_storage_locations;
create policy "Read cellar locations" on public.cellar_storage_locations for select to authenticated
  using (cellar_id in (select cellar_id from public.cellar_members where user_id = (select auth.uid())));

create or replace function public.save_cellar_fridge(p_cellar_id text, p_name text, p_level_count integer, p_first_level integer default 1, p_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare fridge_id uuid; n integer;
begin
  if not exists (select 1 from public.cellar_members where cellar_id = p_cellar_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the cellar owner can manage wine fridges.' using errcode = '42501';
  end if;
  if p_name is null or length(trim(p_name)) not between 1 and 80 or p_level_count is null or p_level_count not between 1 and 50 or p_first_level is null or p_first_level not in (0, 1) then
    raise exception 'Choose a name, 1 to 50 levels, and a first level of 0 or 1.' using errcode = '22023';
  end if;
  -- Serialize fridge mutations, including names and level ranges.
  perform 1 from public.cellars where id = p_cellar_id for update;
  if p_id is null then
    insert into public.cellar_fridges (cellar_id, name, level_count, first_level)
      values (p_cellar_id, trim(p_name), p_level_count, p_first_level) returning id into fridge_id;
  else
    select id into fridge_id from public.cellar_fridges where cellar_id = p_cellar_id and id = p_id for update;
    if not found then raise exception 'Wine fridge not found.' using errcode = 'P0002'; end if;
    -- The wine FK blocks deleting occupied levels. The entire edit rolls back.
    delete from public.cellar_storage_locations where cellar_id = p_cellar_id and cellar_storage_locations.fridge_id = p_id
      and (level < p_first_level or level >= p_first_level + p_level_count);
    update public.cellar_fridges set name = trim(p_name), level_count = p_level_count, first_level = p_first_level where id = p_id;
    -- Renaming cascades to every bottle at that location, in this transaction.
    update public.cellar_storage_locations set label = trim(p_name) || ' - L' || level where cellar_storage_locations.fridge_id = p_id;
  end if;
  for n in p_first_level..(p_first_level + p_level_count - 1) loop
    insert into public.cellar_storage_locations (cellar_id, label, fridge_id, level)
      values (p_cellar_id, trim(p_name) || ' - L' || n, fridge_id, n)
      on conflict (cellar_id, label) do update set fridge_id = excluded.fridge_id, level = excluded.level
      where cellar_storage_locations.fridge_id is null;
  end loop;
  return fridge_id;
end $$;

create or replace function public.delete_cellar_fridge(p_cellar_id text, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.cellar_members where cellar_id = p_cellar_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the cellar owner can manage wine fridges.' using errcode = '42501';
  end if;
  perform 1 from public.cellars where id = p_cellar_id for update;
  -- Location cascades are rejected if any wine still references this fridge.
  delete from public.cellar_fridges where cellar_id = p_cellar_id and id = p_id;
  if not found then raise exception 'Wine fridge not found.' using errcode = 'P0002'; end if;
end $$;
revoke all on function public.save_cellar_fridge(text, text, integer, integer, uuid), public.delete_cellar_fridge(text, uuid) from public, anon;
grant execute on function public.save_cellar_fridge(text, text, integer, integer, uuid), public.delete_cellar_fridge(text, uuid) to authenticated;
commit;
