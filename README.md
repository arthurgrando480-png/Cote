# Cote

Réseau social où chacun publie ses photos et note celles des autres, de 1 à 10 (avec possibilité de passer). Stack : **Next.js** + **Supabase** (base de données, authentification, stockage des photos). Hébergement gratuit sur **Vercel**.

Coût pour quelques centaines d'utilisateurs : **0 €**, sur les paliers gratuits de Supabase et Vercel.

---

## 1. Créer le projet Supabase (5 min)

1. Va sur [supabase.com](https://supabase.com) → crée un compte → **New project**.
2. Choisis un nom, un mot de passe de base de données (à garder de côté), une région proche de tes utilisateurs.
3. Une fois le projet créé, va dans **SQL Editor** → **New query**.
4. Colle tout le contenu du fichier [`supabase/schema.sql`](./supabase/schema.sql) de ce dossier, puis clique sur **Run**.
   Ça crée les tables (`profiles`, `photos`, `ratings`), les règles de sécurité, et le bucket de stockage `photos`.
5. Va dans **Project Settings → API**. Note :
   - **Project URL**
   - **anon public key**

   Tu en auras besoin à l'étape 2.

6. (Optionnel mais recommandé pour un test rapide entre proches) Dans **Authentication → Providers → Email**, tu peux désactiver **Confirm email** si tu veux que les gens accèdent au site immédiatement après inscription, sans cliquer sur un lien reçu par email. Sinon, laisse activé pour valider que les emails sont réels.

## 2. Lancer le site en local

Il te faut [Node.js](https://nodejs.org) (version 20 ou plus) installé.

```bash
# Dans le dossier du projet
cp .env.local.example .env.local
```

Ouvre `.env.local` et colle les deux valeurs récupérées à l'étape 1 :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Puis :

```bash
npm install
npm run dev
```

Le site tourne sur [http://localhost:3000](http://localhost:3000). Crée un compte, publie une photo, teste la notation.

## 3. Mettre le site en ligne gratuitement (Vercel)

1. Crée un dépôt sur GitHub et pousse ce dossier dedans (sans le fichier `.env.local`, qui est ignoré automatiquement par `.gitignore`).
2. Va sur [vercel.com](https://vercel.com) → connecte-toi avec GitHub → **Add New → Project** → sélectionne le dépôt.
3. Dans **Environment Variables**, ajoute les deux mêmes variables que dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique sur **Deploy**. Après 1-2 minutes, ton site est en ligne sur une URL du type `cote-xxxx.vercel.app`.

Tu peux ensuite inviter tes quelques centaines de testeurs avec ce lien.

## Comment ça marche

- **Design** : fond clair, dégradé turquoise → émeraude, une seule typo (Plus Jakarta Sans). Navigation par une barre d'icônes en bas (Noter / Publier / Profil), comme la plupart des apps mobiles actuelles.
- **Inscription** : email + mot de passe. Un pseudo est demandé, affiché sur le profil.
- **Noter** (`/rate`) : la photo occupe tout l'écran. Deux boutons flottent en bas — **Noter** (fait apparaître 10 billes numérotées, une par note) et **Passer**.
- **Publier** (`/upload`) : chacun peut ajouter ses photos (JPEG/PNG/WebP, 8 Mo max).
- **Profil** (`/profile`) : grille de photos pleine largeur façon TikTok, avec la note et le nombre de votes affichés directement sur chaque miniature. Possibilité de supprimer une photo (icône en coin).

## Limites connues de cette V1 (à garder en tête pour la suite)

- Pas de modération de contenu : à surveiller manuellement tant que le groupe de testeurs est restreint.
- Pas de récupération de mot de passe oublié dans l'interface (Supabase le permet côté API, mais l'écran n'a pas été construit — à ajouter si besoin).
- Le choix de la prochaine photo à noter est aléatoire parmi un lot ; pas d'algorithme de recommandation.
- Les images sont dans un bucket public : n'importe qui avec l'URL exacte d'une image peut la voir sans compte, mais les URLs ne sont ni listées ni devinables. Pour un vrai lancement public, il faudra probablement revoir ce point ainsi qu'ajouter des CGU / une politique de contenu.

## Structure du projet

```
app/
  (marketing)/page.tsx    → page d'accueil publique
  (auth)/login, signup    → connexion / inscription
  (app)/rate, upload, profile → l'application (protégée)
  auth/callback            → confirmation d'email
components/                → composants UI (plateau de notation, formulaire d'envoi, etc.)
lib/supabase/              → clients Supabase (navigateur, serveur, middleware)
supabase/schema.sql         → tout le schéma de base de données à exécuter sur Supabase
proxy.ts                    → vérifie la session et protège les pages sur chaque requête
```
