-- Run this entire file in the Flint project's Supabase SQL Editor.
-- Prerequisite: create Rodrigo's account in Authentication > Users first.
-- Requires the existing people_and_journals migration (owner roles / people).
-- Safe to rerun: preserves the cellar's settings, people and any later wines.
-- No wines, journal entries, fridges or access to other cellars are added.
begin;

do $$
declare
  rodrigo_id uuid;
  new_cellar_id constant text := 'aa6bceae-3a83-4c8b-a759-3b5e8743a47d';
begin
  -- Serialize repeated runs, including runs in different SQL Editor tabs.
  perform pg_advisory_xact_lock(hashtext('flint:add-rodrigo-cellar'));

  select id into strict rodrigo_id from auth.users
    where lower(email) = 'rodrigoramosvieira@gmail.com';

  if exists (select 1 from public.cellars where id = new_cellar_id) then
    if not exists (
      select 1 from public.cellar_members
      where cellar_id = new_cellar_id and user_id = rodrigo_id and role = 'owner'
    ) then
      raise exception 'The target cellar already exists without Rodrigo as its owner. No changes made; check the cellar before assigning access.';
    end if;
  else
    insert into public.cellars (id, name, locale)
      values (new_cellar_id, 'Rodrigo’s cellar', 'en');
    insert into public.cellar_members (cellar_id, user_id, role)
      values (new_cellar_id, rodrigo_id, 'owner');
    -- The membership trigger creates his person record for the journal picker.
    update public.cellar_people set name = 'Rodrigo'
      where cellar_id = new_cellar_id and user_id = rodrigo_id;
  end if;
exception
  when no_data_found then
    raise exception 'Create the Authentication account for rodrigoramosvieira@gmail.com first, then run this script again.';
  when too_many_rows then
    raise exception 'More than one Authentication account matches Rodrigo’s email. Resolve this before assigning access.';
end;
$$;

commit;

-- Expected on the first run: Rodrigo’s cellar, owner, 0 wine records, 0 bottles.
select c.id as cellar_id, c.name as cellar_name, c.locale, u.email, m.role,
  (select count(*) from public.wines w where w.cellar_id = c.id) as wine_records,
  (select coalesce(sum(w.quantity), 0) from public.wines w
    where w.cellar_id = c.id and w.status = 'in_cellar') as active_bottles
from public.cellars c
join public.cellar_members m on m.cellar_id = c.id
join auth.users u on u.id = m.user_id
where c.id = 'aa6bceae-3a83-4c8b-a759-3b5e8743a47d'
  and lower(u.email) = 'rodrigoramosvieira@gmail.com';
