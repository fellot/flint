begin;

create table public.cellars (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  locale text not null default 'en' check (locale in ('en', 'pt')),
  created_at timestamptz not null default now()
);

create table public.cellar_members (
  cellar_id text not null references public.cellars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cellar_id, user_id)
);
create index cellar_members_user_id_idx on public.cellar_members(user_id);

create table public.wines (
  -- Legacy IDs overlap between files; identity is scoped to the cellar.
  id text not null default gen_random_uuid()::text,
  cellar_id text not null references public.cellars(id) on delete cascade,
  bottle text not null check (length(trim(bottle)) > 0),
  country text not null check (length(trim(country)) > 0),
  region text not null default '',
  vintage integer not null default 0 check (vintage between 0 and 9999),
  drinking_window text not null default '',
  -- Preserve existing values such as 'Past peak' and '2040+'.
  peak_year text not null default '',
  food_pairing_notes text not null default '',
  meal_suggestion text not null default '',
  style text not null check (length(trim(style)) > 0),
  grapes text not null default '',
  status text not null default 'in_cellar' check (status in ('in_cellar', 'consumed', 'sold', 'gifted')),
  consumed_date date,
  notes text not null default '',
  rating numeric check (rating between 0 and 100),
  price numeric check (price >= 0),
  location text not null default '',
  quantity integer not null default 1 check (quantity >= 0),
  technical_sheet_url text,
  bottle_image_url text,
  from_cellar boolean not null default true,
  coravin boolean not null default false,
  coravin_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cellar_id, id)
);
create index wines_cellar_status_idx on public.wines(cellar_id, status);

create function public.set_wine_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger wines_updated_at before update on public.wines
for each row execute function public.set_wine_updated_at();

alter table public.cellars enable row level security;
alter table public.cellar_members enable row level security;
alter table public.wines enable row level security;

-- Membership is administered through SQL/the service role, never user metadata.
revoke all on public.cellars, public.cellar_members, public.wines from anon, authenticated;
grant select on public.cellars, public.cellar_members to authenticated;
grant select, insert, update, delete on public.wines to authenticated;
grant all on public.cellars, public.cellar_members, public.wines to service_role;

create policy "Read own memberships" on public.cellar_members for select to authenticated
using (user_id = (select auth.uid()));

create policy "Read assigned cellars" on public.cellars for select to authenticated
using (id in (select cellar_id from public.cellar_members where user_id = (select auth.uid())));

create policy "Manage assigned wines" on public.wines for all to authenticated
using (cellar_id in (select cellar_id from public.cellar_members where user_id = (select auth.uid())))
with check (cellar_id in (select cellar_id from public.cellar_members where user_id = (select auth.uid())));

insert into public.cellars (id, name, locale) values
  ('1', 'Felipe’s cellar', 'en'),
  ('2', 'Adega do Gerson', 'pt'),
  ('3', 'Adega do Lorenzo', 'pt');

-- Updating inventory and recording a consumed bottle must succeed together.
create function public.consume_wine(
  p_cellar_id text,
  p_wine_id text,
  p_quantity integer,
  p_consumed_date date,
  p_notes text default null,
  p_location text default 'N/A'
) returns setof public.wines
language plpgsql security invoker set search_path = '' as $$
declare
  original public.wines;
  consumed public.wines;
begin
  select * into original from public.wines
    where cellar_id = p_cellar_id and id = p_wine_id for update;
  if not found then raise exception 'Wine not found.' using errcode = 'P0002'; end if;
  if original.status <> 'in_cellar' or p_quantity is null or p_quantity < 1 or p_quantity > original.quantity or p_consumed_date is null then
    raise exception 'The wine quantity or status has changed. Refresh and try again.' using errcode = '22023';
  end if;
  if p_quantity = original.quantity then
    return query update public.wines set status = 'consumed', consumed_date = p_consumed_date,
      notes = coalesce(p_notes, original.notes), location = coalesce(p_location, 'N/A')
      where cellar_id = p_cellar_id and id = p_wine_id returning *;
  else
    return query update public.wines set quantity = quantity - p_quantity
      where cellar_id = p_cellar_id and id = p_wine_id returning *;
    consumed := original;
    consumed.id := gen_random_uuid()::text;
    consumed.quantity := p_quantity;
    consumed.status := 'consumed';
    consumed.consumed_date := p_consumed_date;
    consumed.notes := coalesce(p_notes, original.notes);
    consumed.location := coalesce(p_location, 'N/A');
    consumed.created_at := now();
    consumed.updated_at := now();
    return query insert into public.wines select consumed.* returning *;
  end if;
end;
$$;
revoke all on function public.consume_wine(text, text, integer, date, text, text) from public, anon;
grant execute on function public.consume_wine(text, text, integer, date, text, text) to authenticated;

commit;
