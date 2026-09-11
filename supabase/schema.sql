-- ============================================================
-- Schéma "Cote" — à exécuter en une fois dans Supabase
-- (Dashboard > SQL Editor > New query > coller > Run)
-- ============================================================

-- 1. PROFILS ---------------------------------------------------
-- Une ligne par utilisateur, créée automatiquement à l'inscription.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null,
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

-- Création automatique du profil à l'inscription.
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
  owner_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists photos_owner_id_idx on public.photos (owner_id);

alter table public.photos enable row level security;

create policy "toutes les photos actives sont visibles par les connectés"
  on public.photos for select
  to authenticated
  using (true);

create policy "un utilisateur publie ses propres photos"
  on public.photos for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "un utilisateur supprime ses propres photos"
  on public.photos for delete
  to authenticated
  using (owner_id = auth.uid());

-- 3. NOTES (ratings) ---------------------------------------------
-- score = 1..10, ou NULL si l'utilisateur a passé la photo.
-- Un utilisateur ne peut interagir qu'une seule fois avec une photo donnée.

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

-- 4. STOCKAGE DES PHOTOS ------------------------------------------
-- Bucket public en lecture (les photos doivent être vues par tous
-- les utilisateurs connectés pour être notées), écriture limitée
-- au propriétaire dans son propre dossier `{user_id}/...`.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "lecture publique des photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos');

create policy "un utilisateur dépose ses photos dans son propre dossier"
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
