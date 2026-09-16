-- Run after 20260916000000_people_and_journals.sql.
-- Adds people to an existing tasting without changing inventory or reviews.
begin;

create or replace function public.add_wine_participants(p_cellar_id text, p_wine_id text, p_person_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  caller_role text;
  wine_status text;
begin
  select role into caller_role from public.cellar_members
    where cellar_id = p_cellar_id and user_id = auth.uid();
  if caller_role is null then
    raise exception 'You do not have access to this cellar.' using errcode = '42501';
  end if;

  -- Serialize additions with other tasting edits/deletion.
  select status into wine_status from public.wines
    where cellar_id = p_cellar_id and id = p_wine_id for update;
  if not found then raise exception 'Wine not found.' using errcode = 'P0002'; end if;
  if wine_status <> 'consumed' then
    raise exception 'Participants can only be added to consumed wines.' using errcode = '22023';
  end if;
  if caller_role <> 'owner' and not exists (
    select 1 from public.wine_participants wp
    join public.cellar_people cp on cp.cellar_id = wp.cellar_id and cp.id = wp.person_id
    where wp.cellar_id = p_cellar_id and wp.wine_id = p_wine_id and cp.user_id = auth.uid()
  ) then
    raise exception 'Only the cellar owner or a participant can add people to this tasting.' using errcode = '42501';
  end if;

  if coalesce(cardinality(p_person_ids), 0) = 0 or cardinality(p_person_ids) > 100
     or array_position(p_person_ids, null) is not null or exists (
       select 1 from unnest(p_person_ids) p(id) where not exists (
         select 1 from public.cellar_people cp
         join public.cellar_members m on m.cellar_id = cp.cellar_id and m.user_id = cp.user_id
         where cp.cellar_id = p_cellar_id and cp.id = p.id
       )
     ) then
    raise exception 'Choose between 1 and 100 active people from this cellar.' using errcode = '22023';
  end if;

  -- Additions are idempotent. Existing participants and all personal reviews
  -- remain untouched, including when two people submit overlapping additions.
  insert into public.wine_participants (cellar_id, wine_id, person_id)
    select p_cellar_id, p_wine_id, id from (select distinct unnest(p_person_ids) id) people
    on conflict (cellar_id, wine_id, person_id) do nothing;
end;
$$;
revoke all on function public.add_wine_participants(text, text, uuid[]) from public, anon;
grant execute on function public.add_wine_participants(text, text, uuid[]) to authenticated;

commit;
