-- ============================================================
-- Schéma "Cote" — à exécuter en une fois dans Supabase (nouveau projet)
-- ============================================================

-- 1. PROFILS ---------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profils visibles par tous les connectés"
  on public.profiles for select
  to authenticated
  using (true);

create policy "un utilisateur modifie son propre profil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'pseudo', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. PHOTOS ------------------------------------------------------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  is_active boolean not null default true,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists photos_owner_id_idx on public.photos (owner_id);

alter table public.photos enable row level security;

create policy "photos approuvées visibles par tous, les siennes toujours visibles"
  on public.photos for select
  to authenticated
  using (moderation_status = 'approved' or owner_id = auth.uid());

create policy "un utilisateur publie ses propres photos en attente de modération"
  on public.photos for insert
  to authenticated
  with check (owner_id = auth.uid() and moderation_status = 'pending');

create policy "un utilisateur supprime ses propres photos"
  on public.photos for delete
  to authenticated
  using (owner_id = auth.uid());

-- 3. NOTES (ratings) ---------------------------------------------
create table if not exists public.ratings (
  id bigint generated always as identity primary key,
  photo_id uuid not null references public.photos (id) on delete cascade,
  rater_id uuid not null references auth.users (id) on delete cascade,
  score smallint check (score between 1 and 10),
  created_at timestamptz not null default now(),
  unique (photo_id, rater_id)
);

create index if not exists ratings_rater_id_idx on public.ratings (rater_id);
create index if not exists ratings_photo_id_idx on public.ratings (photo_id);

alter table public.ratings enable row level security;

create policy "un utilisateur voit ses votes ou les votes sur ses photos"
  on public.ratings for select
  to authenticated
  using (
    rater_id = auth.uid()
    or exists (
      select 1 from public.photos p
      where p.id = ratings.photo_id and p.owner_id = auth.uid()
    )
  );

create policy "un utilisateur note les photos des autres, jamais les siennes"
  on public.ratings for insert
  to authenticated
  with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.photos p
      where p.id = photo_id and p.owner_id <> auth.uid()
    )
  );

-- 4. SIGNALEMENTS (reports) ---------------------------------------
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  photo_id uuid not null references public.photos (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "un utilisateur crée ses propres signalements"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "un utilisateur voit ses propres signalements"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

-- 5. STOCKAGE DES PHOTOS (et avatars, dans le même dossier utilisateur) ---
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "lecture publique des photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos');

create policy "un utilisateur dépose ses fichiers dans son propre dossier"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "un utilisateur supprime ses propres fichiers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. AUTORISATIONS D'ACCÈS AUX TABLES ------------------------------
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.photos to authenticated;
grant select, insert on public.ratings to authenticated;
grant select, insert on public.reports to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant usage on schema public to service_role;
grant all on public.profiles to service_role;
grant all on public.photos to service_role;
grant all on public.ratings to service_role;
grant all on public.reports to service_role;
grant usage, select on all sequences in schema public to service_role;

notify pgrst, 'reload schema';
