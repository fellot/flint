-- Run in Supabase SQL Editor. Saves private wine-buyer chats, never PDF bytes.
-- Safe to rerun. Requires the existing cellars and cellar_members tables.
begin;

-- Check the selected database before creating anything. A working Flint cellar
-- already has these tables; never create empty substitutes to bypass this check.
do $$
declare missing text[];
begin
  select array_agg(required.name order by required.name) into missing
  from (values ('public.cellars'), ('public.cellar_members'), ('auth.users')) as required(name)
  where to_regclass(required.name) is null;
  if missing is not null then
    raise exception 'Buyer history needs the existing Flint database tables.'
      using errcode = 'P0001',
        detail = 'Missing: ' || array_to_string(missing, ', '),
        hint = 'Check that SQL Editor is in the same Supabase project as your website. Run supabase/check-buyer-history.sql to inspect its schema. Only for a new installation, apply 20260915000000_cellars_and_wines.sql and the existing setup migrations first.';
  end if;
end;
$$;

create table if not exists public.buyer_conversations (
  id uuid primary key default gen_random_uuid(),
  cellar_id text not null references public.cellars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  brief jsonb not null default '{"market":"","retailers":"","budget":""}'::jsonb
    check (jsonb_typeof(brief) = 'object' and octet_length(brief::text) <= 4000),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists buyer_conversations_history_idx
  on public.buyer_conversations (user_id, cellar_id, updated_at desc, id);

create table if not exists public.buyer_turns (
  id uuid primary key,
  conversation_id uuid not null references public.buyer_conversations(id) on delete cascade,
  ordinal integer not null check (ordinal > 0),
  user_message text not null check (length(user_message) between 1 and 2000),
  attachment_name text check (length(attachment_name) <= 120),
  reply jsonb check (jsonb_typeof(reply) = 'object' and octet_length(reply::text) <= 128000),
  error_text text check (length(error_text) <= 500),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  unique (conversation_id, ordinal),
  check ((status = 'completed' and reply is not null and error_text is null)
    or (status <> 'completed' and reply is null))
);

alter table public.buyer_conversations enable row level security;
alter table public.buyer_turns enable row level security;
revoke all on public.buyer_conversations, public.buyer_turns from anon, authenticated;
grant select on public.buyer_conversations, public.buyer_turns to authenticated;
grant update (title) on public.buyer_conversations to authenticated;
grant all on public.buyer_conversations, public.buyer_turns to service_role;

drop policy if exists "Own buyer conversations" on public.buyer_conversations;
create policy "Own buyer conversations" on public.buyer_conversations for all to authenticated
using (user_id = (select auth.uid()) and cellar_id in
  (select cellar_id from public.cellar_members where user_id = (select auth.uid())))
with check (user_id = (select auth.uid()) and cellar_id in
  (select cellar_id from public.cellar_members where user_id = (select auth.uid())));
drop policy if exists "Own buyer turns" on public.buyer_turns;
create policy "Own buyer turns" on public.buyer_turns for select to authenticated
using (conversation_id in (select id from public.buyer_conversations));

-- Reserve and save a question before any paid AI request. Row locks and revision
-- checks prevent two tabs from overwriting one another or running the same turn.
create or replace function public.begin_buyer_turn(
  p_cellar_id text, p_conversation_id uuid, p_turn_id uuid, p_revision integer,
  p_message text, p_brief jsonb, p_attachment_name text default null
) returns public.buyer_conversations
language plpgsql security definer set search_path = '' as $$
declare c public.buyer_conversations;
begin
  if auth.uid() is null or not exists (select 1 from public.cellar_members
    where cellar_id = p_cellar_id and user_id = auth.uid()) then
    raise exception 'You do not have access to this cellar.' using errcode = '42501';
  end if;
  if p_revision is null or p_revision < 0 or p_message is null or length(btrim(p_message)) not between 1 and 2000
    or p_brief is null or jsonb_typeof(p_brief) <> 'object' or octet_length(p_brief::text) > 4000 then
    raise exception 'Invalid buyer conversation.' using errcode = '22023';
  end if;
  if p_revision = 0 then
    insert into public.buyer_conversations (id, cellar_id, user_id, title)
      values (p_conversation_id, p_cellar_id, auth.uid(), left(btrim(p_message), 120))
      on conflict (id) do nothing;
  end if;
  select * into c from public.buyer_conversations where id = p_conversation_id for update;
  if not found or c.user_id <> auth.uid() or c.cellar_id <> p_cellar_id then
    raise exception 'Conversation not found.' using errcode = 'P0002';
  end if;
  if c.revision <> p_revision then
    raise exception 'This conversation changed. Reopen it from Previous conversations.' using errcode = '40001';
  end if;
  if exists (select 1 from public.buyer_turns where conversation_id = c.id
    and status = 'pending' and created_at > now() - interval '120 seconds') then
    raise exception 'A reply is still being prepared. Refresh the conversation shortly.' using errcode = '40001';
  end if;
  update public.buyer_turns set status = 'failed', error_text = 'Research was interrupted. You can ask again.'
    where conversation_id = c.id and status = 'pending';
  insert into public.buyer_turns (id, conversation_id, ordinal, user_message, attachment_name)
    values (p_turn_id, c.id, c.revision + 1, btrim(p_message), p_attachment_name);
  update public.buyer_conversations set revision = revision + 1, brief = p_brief, updated_at = now()
    where id = c.id returning * into c;
  return c;
end;
$$;

-- Finish only the reserved turn; never replace an existing answer or let a late
-- answer replace a turn already marked interrupted by a later request.
create or replace function public.finish_buyer_turn(
  p_cellar_id text, p_conversation_id uuid, p_turn_id uuid, p_reply jsonb, p_error text
) returns void language plpgsql security definer set search_path = '' as $$
declare c public.buyer_conversations;
begin
  select * into c from public.buyer_conversations where id = p_conversation_id for update;
  if not found or c.user_id <> auth.uid() or c.cellar_id <> p_cellar_id or not exists
    (select 1 from public.cellar_members where cellar_id = c.cellar_id and user_id = auth.uid()) then
    raise exception 'Conversation not found.' using errcode = 'P0002';
  end if;
  if (p_reply is null) = (p_error is null) then
    raise exception 'Supply a reply or a failure message.' using errcode = '22023';
  end if;
  update public.buyer_turns set reply = p_reply, error_text = p_error,
    status = case when p_reply is null then 'failed' else 'completed' end
    where id = p_turn_id and conversation_id = c.id and status = 'pending';
  if not found then raise exception 'This question has already been completed.' using errcode = '40001'; end if;
  update public.buyer_conversations set updated_at = now(),
    brief = case when p_reply is not null then p_reply->'brief' else brief end where id = c.id;
end;
$$;
revoke all on function public.begin_buyer_turn(text,uuid,uuid,integer,text,jsonb,text) from public, anon;
revoke all on function public.finish_buyer_turn(text,uuid,uuid,jsonb,text) from public, anon;
grant execute on function public.begin_buyer_turn(text,uuid,uuid,integer,text,jsonb,text) to authenticated;
grant execute on function public.finish_buyer_turn(text,uuid,uuid,jsonb,text) to authenticated;
notify pgrst, 'reload schema';
commit;
