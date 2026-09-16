-- Run once in Supabase SQL Editor, after the original schema, wine import,
-- and account assignments. No admin key is needed by the application.
begin;

alter table public.cellar_members add column role text not null default 'member'
  check (role in ('owner', 'member'));

-- Existing owners, taken from assign-cellars.sql. Alice remains a member.
update public.cellar_members m set role = 'owner'
from auth.users u, (values
  ('1', 'felipeloturco@gmail.com'),
  ('2', 'loturco.pa@uol.com.br'),
  ('3', 'lorenzocecchini@gmail.com')
) as owners(cellar_id, email)
where m.user_id = u.id and m.cellar_id = owners.cellar_id and lower(u.email) = owners.email;

create table public.cellar_people (
  id uuid primary key default gen_random_uuid(),
  cellar_id text not null references public.cellars(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 120),
  email text not null check (email = lower(trim(email)) and length(email) <= 254 and email like '%_@_%._%'),
  created_at timestamptz not null default now(),
  unique (cellar_id, id),
  unique (cellar_id, user_id),
  unique (cellar_id, email)
);

create table public.wine_participants (
  cellar_id text not null,
  wine_id text not null,
  person_id uuid not null,
  primary key (cellar_id, wine_id, person_id),
  foreign key (cellar_id, wine_id) references public.wines(cellar_id, id) on delete cascade,
  foreign key (cellar_id, person_id) references public.cellar_people(cellar_id, id) on delete cascade
);
create index wine_participants_person_idx on public.wine_participants(person_id);

create table public.wine_reviews (
  cellar_id text not null,
  wine_id text not null,
  person_id uuid not null,
  rating integer check (rating between 0 and 100),
  comment text not null default '' check (length(comment) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cellar_id, wine_id, person_id),
  foreign key (cellar_id, wine_id, person_id)
    references public.wine_participants(cellar_id, wine_id, person_id) on delete cascade
);
create trigger wine_reviews_updated_at before update on public.wine_reviews
for each row execute function public.set_wine_updated_at();

alter table public.cellar_people enable row level security;
alter table public.wine_participants enable row level security;
alter table public.wine_reviews enable row level security;
revoke all on public.cellar_people, public.wine_participants, public.wine_reviews from public, anon, authenticated;
grant select on public.cellar_people, public.wine_participants to authenticated;
grant select, insert, update, delete on public.wine_reviews to authenticated;
grant all on public.cellar_people, public.wine_participants, public.wine_reviews to service_role;

create policy "Read people in assigned cellars" on public.cellar_people for select to authenticated
using (cellar_id in (select cellar_id from public.cellar_members where user_id = (select auth.uid())));
create policy "Read participants in assigned cellars" on public.wine_participants for select to authenticated
using (cellar_id in (select cellar_id from public.cellar_members where user_id = (select auth.uid())));
create policy "Manage only own participant review" on public.wine_reviews for all to authenticated
using (
  person_id in (select id from public.cellar_people where user_id = (select auth.uid()))
  and exists (select 1 from public.wines w where w.cellar_id = wine_reviews.cellar_id and w.id = wine_reviews.wine_id and w.status = 'consumed')
)
with check (
  person_id in (select id from public.cellar_people where user_id = (select auth.uid()))
  and exists (select 1 from public.wines w where w.cellar_id = wine_reviews.cellar_id and w.id = wine_reviews.wine_id and w.status = 'consumed')
);

-- Keep SQL/admin membership assignments compatible with the people picker.
create function public.sync_cellar_member_person() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.cellar_people (cellar_id, user_id, name, email)
    select new.cellar_id, u.id, coalesce(nullif(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)), lower(u.email)
    from auth.users u where u.id = new.user_id
  on conflict (cellar_id, email) do update set user_id = excluded.user_id
    where public.cellar_people.user_id is null;
  return new;
end;
$$;
revoke all on function public.sync_cellar_member_person() from public, anon, authenticated;
create trigger cellar_member_person after insert on public.cellar_members
for each row execute function public.sync_cellar_member_person();
insert into public.cellar_people (cellar_id, user_id, name, email)
select m.cellar_id, u.id, coalesce(nullif(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)), lower(u.email)
from public.cellar_members m join auth.users u on u.id = m.user_id;

-- The old records have no participant attribution. Preserve them for the owner;
-- never guess that a newly added member drank every historical bottle.
insert into public.wine_participants (cellar_id, wine_id, person_id)
select w.cellar_id, w.id, p.id from public.wines w
join public.cellar_members m on m.cellar_id = w.cellar_id and m.role = 'owner'
join public.cellar_people p on p.cellar_id = m.cellar_id and p.user_id = m.user_id
where w.status = 'consumed';
-- Preserve legacy ratings/notes, but do not assign them as anybody's personal review.
update public.wines set location = '' where lower(trim(location)) in ('wine heaven', 'wine hell');

create function public.save_cellar_person(p_cellar_id text, p_name text, p_email text, p_person_id uuid default null, p_allow_pending boolean default false)
returns public.cellar_people language plpgsql security definer set search_path = '' as $$
declare
  account_id uuid;
  person public.cellar_people;
  normalized_email text := nullif(lower(trim(p_email)), '');
begin
  if not exists (select 1 from public.cellar_members where cellar_id = p_cellar_id and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the cellar owner can manage people.' using errcode = '42501';
  end if;
  if p_person_id is not null then
    select * into person from public.cellar_people where cellar_id = p_cellar_id and id = p_person_id for update;
    if not found then raise exception 'Person not found.' using errcode = 'P0002'; end if;
    if person.user_id is not null and normalized_email is distinct from person.email then
      raise exception 'An existing account cannot be reassigned to another email.' using errcode = '22023';
    end if;
  end if;
  select id into account_id from auth.users where lower(email) = normalized_email and email_confirmed_at is not null;
  if account_id is null and not p_allow_pending and person.user_id is null then
    raise exception 'Invitations are not configured. Ask the site administrator to enable them.' using errcode = '22023';
  end if;
  if p_person_id is null then
    insert into public.cellar_people (cellar_id, user_id, name, email)
      values (p_cellar_id, account_id, trim(p_name), normalized_email) returning * into person;
  else
    update public.cellar_people set name = trim(p_name), email = normalized_email, user_id = coalesce(person.user_id, account_id)
      where cellar_id = p_cellar_id and id = p_person_id returning * into person;
  end if;
  if person.user_id is not null then
    insert into public.cellar_members (cellar_id, user_id) values (p_cellar_id, person.user_id) on conflict do nothing;
  end if;
  return person;
end;
$$;
revoke all on function public.save_cellar_person(text, text, text, uuid, boolean) from public, anon;
grant execute on function public.save_cellar_person(text, text, text, uuid, boolean) to authenticated;

-- Email access activates only after Auth has verified that email. This also
-- activates cellar access when an invited user accepts and sets up their account.
create function public.claim_cellar_people() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null then
    with claimed as (
      update public.cellar_people set user_id = new.id
      where email = lower(new.email) and user_id is null returning cellar_id
    )
    insert into public.cellar_members (cellar_id, user_id) select cellar_id, new.id from claimed on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.claim_cellar_people() from public, anon, authenticated;
create trigger claim_cellar_people after insert or update of email_confirmed_at, email on auth.users
for each row execute function public.claim_cellar_people();

-- Private helper, reachable only through the checked consumption/logging RPCs.
create function public.record_wine_participants(p_cellar_id text, p_wine_id text, p_person_ids uuid[], p_rating integer, p_comment text)
returns void language plpgsql security definer set search_path = '' as $$
declare own_person uuid;
begin
  if coalesce(cardinality(p_person_ids), 0) = 0 or array_position(p_person_ids, null) is not null or exists (
    select 1 from unnest(p_person_ids) p(id) where not exists (
      select 1 from public.cellar_people cp join public.cellar_members m on m.cellar_id = cp.cellar_id and m.user_id = cp.user_id
      where cp.cellar_id = p_cellar_id and cp.id = p.id
    )
  ) then raise exception 'Choose at least one active person from this cellar.' using errcode = '22023'; end if;
  insert into public.wine_participants (cellar_id, wine_id, person_id)
    select p_cellar_id, p_wine_id, id from (select distinct unnest(p_person_ids) id) people;
  select id into own_person from public.cellar_people where cellar_id = p_cellar_id and user_id = auth.uid() and id = any(p_person_ids);
  if p_rating is not null or coalesce(p_comment, '') <> '' then
    if own_person is null then raise exception 'You can review only a wine you shared.' using errcode = '22023'; end if;
    insert into public.wine_reviews (cellar_id, wine_id, person_id, rating, comment)
      values (p_cellar_id, p_wine_id, own_person, p_rating, coalesce(p_comment, ''));
  end if;
end;
$$;
revoke all on function public.record_wine_participants(text, text, uuid[], integer, text) from public, anon, authenticated;

-- Authenticated clients cannot bypass the participant step with a direct wine
-- insert/status update. Checked RPCs below run as their database owner; ordinary
-- edits to a consumed wine's details remain allowed.
create function public.require_tasting_for_consumption() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if (tg_op = 'INSERT' and new.status = 'consumed') or
       (tg_op = 'UPDATE' and old.status is distinct from new.status and (old.status = 'consumed' or new.status = 'consumed')) then
      raise exception 'Record consumption with participants using the tasting action.' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.require_tasting_for_consumption() from public, anon, authenticated;
create trigger require_tasting_for_consumption before insert or update on public.wines
for each row execute function public.require_tasting_for_consumption();

drop function public.consume_wine(text, text, integer, date, text, text);
create function public.consume_wine(p_cellar_id text, p_wine_id text, p_quantity integer, p_consumed_date date,
  p_person_ids uuid[], p_rating integer default null, p_comment text default '')
returns setof public.wines language plpgsql security definer set search_path = '' as $$
declare original public.wines; consumed public.wines;
begin
  if not exists (select 1 from public.cellar_members where cellar_id = p_cellar_id and user_id = auth.uid()) then
    raise exception 'You do not have access to this cellar.' using errcode = '42501';
  end if;
  select * into original from public.wines where cellar_id = p_cellar_id and id = p_wine_id for update;
  if not found then raise exception 'Wine not found.' using errcode = 'P0002'; end if;
  if original.status <> 'in_cellar' or p_quantity is null or p_quantity < 1 or p_quantity > original.quantity or p_consumed_date is null then
    raise exception 'The wine quantity or status has changed. Refresh and try again.' using errcode = '22023';
  end if;
  if p_quantity = original.quantity then
    update public.wines set status = 'consumed', consumed_date = p_consumed_date, location = ''
      where cellar_id = p_cellar_id and id = p_wine_id returning * into consumed;
  else
    return query update public.wines set quantity = quantity - p_quantity where cellar_id = p_cellar_id and id = p_wine_id returning *;
    consumed := original;
    consumed.id := gen_random_uuid()::text;
    consumed.quantity := p_quantity;
    consumed.status := 'consumed';
    consumed.consumed_date := p_consumed_date;
    consumed.location := '';
    consumed.created_at := now(); consumed.updated_at := now();
    insert into public.wines select consumed.*;
  end if;
  perform public.record_wine_participants(p_cellar_id, consumed.id, p_person_ids, p_rating, p_comment);
  return next consumed;
end;
$$;
revoke all on function public.consume_wine(text, text, integer, date, uuid[], integer, text) from public, anon;
grant execute on function public.consume_wine(text, text, integer, date, uuid[], integer, text) to authenticated;

-- A wine enjoyed outside the cellar is also a tasting with participants.
create function public.log_consumed_wine(p_cellar_id text, p_wine jsonb, p_person_ids uuid[], p_rating integer default null, p_comment text default '')
returns public.wines language plpgsql security definer set search_path = '' as $$
declare saved public.wines;
begin
  if not exists (select 1 from public.cellar_members where cellar_id = p_cellar_id and user_id = auth.uid()) then
    raise exception 'You do not have access to this cellar.' using errcode = '42501';
  end if;
  saved := jsonb_populate_record(null::public.wines, p_wine);
  saved.id := gen_random_uuid()::text; saved.cellar_id := p_cellar_id;
  saved.status := 'consumed'; saved.from_cellar := false; saved.location := '';
  saved.created_at := now(); saved.updated_at := now();
  if saved.quantity < 1 or saved.consumed_date is null then
    raise exception 'Specify a positive quantity and consumption date.' using errcode = '22023';
  end if;
  insert into public.wines select saved.*;
  perform public.record_wine_participants(p_cellar_id, saved.id, p_person_ids, p_rating, p_comment);
  return saved;
end;
$$;
revoke all on function public.log_consumed_wine(text, jsonb, uuid[], integer, text) from public, anon;
grant execute on function public.log_consumed_wine(text, jsonb, uuid[], integer, text) to authenticated;

commit;
