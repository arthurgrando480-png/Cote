-- ============================================================
-- Lot du jour : nom de photo optionnel, notifications groupées
-- (nouveaux fans / nouveaux amis), classement hebdomadaire
-- ============================================================

-- 1. Nom optionnel sur une photo -----------------------------
alter table public.photos add column if not exists name text;

-- 2. Notifications --------------------------------------------
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('new_fan', 'new_friend', 'weekly_leaderboard')),
  count int not null default 1,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);

alter table public.notifications enable row level security;

create policy "un utilisateur voit ses propres notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "un utilisateur marque ses notifications comme lues"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. Regroupement automatique des notifications "fan"/"ami" ---
-- Tant qu'une notification du même type n'a pas été lue pour cette
-- personne, les nouveaux événements s'y ajoutent (count + 1) au lieu
-- d'en créer une nouvelle à chaque fois.
create or replace function public.handle_new_fan_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id bigint;
  is_mutual boolean;
begin
  select id into existing_id from public.notifications
    where user_id = new.target_id and type = 'new_fan' and is_read = false
    order by created_at desc limit 1;
  if existing_id is not null then
    update public.notifications set count = count + 1 where id = existing_id;
  else
    insert into public.notifications (user_id, type, count) values (new.target_id, 'new_fan', 1);
  end if;

  select exists(
    select 1 from public.fans where fan_id = new.target_id and target_id = new.fan_id
  ) into is_mutual;

  if is_mutual then
    select id into existing_id from public.notifications
      where user_id = new.fan_id and type = 'new_friend' and is_read = false
      order by created_at desc limit 1;
    if existing_id is not null then
      update public.notifications set count = count + 1 where id = existing_id;
    else
      insert into public.notifications (user_id, type, count) values (new.fan_id, 'new_friend', 1);
    end if;

    select id into existing_id from public.notifications
      where user_id = new.target_id and type = 'new_friend' and is_read = false
      order by created_at desc limit 1;
    if existing_id is not null then
      update public.notifications set count = count + 1 where id = existing_id;
    else
      insert into public.notifications (user_id, type, count) values (new.target_id, 'new_friend', 1);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_fan_created on public.fans;
create trigger on_fan_created
  after insert on public.fans
  for each row execute procedure public.handle_new_fan_notification();

-- 4. Classement hebdomadaire ------------------------------------
-- Deux règles imposées ici, au niveau de la base, pas seulement en
-- façade : (a) uniquement les photos PUBLIÉES pendant la semaine en
-- cours (lundi 00h -> dimanche 24h), (b) minimum 5 votes pour être
-- éligible.
create or replace function public.get_weekly_leaderboard()
returns table (
  photo_id uuid,
  owner_id uuid,
  pseudo text,
  avatar_url text,
  storage_path text,
  avg_score numeric,
  vote_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as photo_id,
    p.owner_id,
    pr.pseudo,
    pr.avatar_url,
    p.storage_path,
    avg(r.score) as avg_score,
    count(r.score) as vote_count
  from public.photos p
  join public.profiles pr on pr.id = p.owner_id
  join public.ratings r on r.photo_id = p.id and r.score is not null
  where p.moderation_status = 'approved'
    and p.created_at >= date_trunc('week', now())
    and p.created_at < date_trunc('week', now()) + interval '7 days'
  group by p.id, p.owner_id, pr.pseudo, pr.avatar_url, p.storage_path
  having count(r.score) >= 5
  order by avg(r.score) desc
  limit 10;
$$;

grant execute on function public.get_weekly_leaderboard() to authenticated;

-- 5. Autorisations ------------------------------------------------
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

notify pgrst, 'reload schema';
