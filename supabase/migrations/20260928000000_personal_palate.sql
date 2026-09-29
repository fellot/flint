-- Run in Supabase SQL Editor after the existing cellar/journal migrations.
-- Preferences belong to an Auth user, never to a shared cellar.
begin;

create table if not exists public.palate_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discovery text not null default 'balanced' check (discovery in ('familiar', 'balanced', 'adventurous')),
  avoid_semi_sweet boolean not null default false,
  preferences text not null default '' check (length(preferences) <= 2000),
  journal_enabled boolean not null default true,
  dismissed_patterns text[] not null default '{}' check (cardinality(dismissed_patterns) <= 100),
  updated_at timestamptz not null default now()
);
alter table public.palate_preferences enable row level security;
revoke all on public.palate_preferences from anon, authenticated;
grant select, insert, update, delete on public.palate_preferences to authenticated;
grant all on public.palate_preferences to service_role;
drop policy if exists "Manage own palate" on public.palate_preferences;
create policy "Manage own palate" on public.palate_preferences for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop trigger if exists palate_updated_at on public.palate_preferences;
create trigger palate_updated_at before update on public.palate_preferences
for each row execute function public.set_wine_updated_at();

-- Seed only Felipe's already-stated preferences, if his confirmed account exists.
-- Other users start neutral. Reruns never overwrite an edited profile.
insert into public.palate_preferences (user_id, discovery, avoid_semi_sweet, preferences)
select id, 'adventurous', true, 'Push me toward unfamiliar styles. No fixed budget for wine purchases; price alone is not a preference.'
from auth.users where lower(email) = 'felipeloturco@gmail.com' and email_confirmed_at is not null
on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
commit;
