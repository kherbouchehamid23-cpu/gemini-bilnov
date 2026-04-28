# Bilnov — Plateforme SaaS de Gestion de Projets Visuels

## Stack Technique

- **Frontend** : Next.js 14 (App Router) + Tailwind CSS + Zustand
- **Backend** : NestJS 10 + Prisma 5 + PostgreSQL
- **Storage** : Cloudflare R2 (prod) / MinIO (dev)
- **Cache** : Redis / Upstash (prod)
- **Déploiement** : Vercel (frontend + API) + Neon PostgreSQL + Cloudflare

---

## Démarrage local

### Prérequis
- Node.js 20+
- pnpm 9+
- Docker Desktop

### Installation

```bash
# 1. Installer les dépendances
pnpm install

# 2. Copier les variables d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Démarrer l'infrastructure (PostgreSQL + Redis + MinIO)
pnpm infra:up

# 4. Créer et migrer la base de données
pnpm db:migrate

# 5. Seeder les données de développement
pnpm db:seed

# 6. Démarrer le projet
pnpm dev
```

L'application sera disponible sur :
- **Frontend** : http://localhost:3000
- **API** : http://localhost:3001/api

Compte de test : `admin@bilnov.com` / `Admin1234!`

---

## Déploiement sur Vercel + Cloudflare

### 1. Base de données — Neon PostgreSQL

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer une base de données `bilnov_prod`
3. Récupérer l'URL de connexion

### 2. Stockage fichiers — Cloudflare R2

1. Activer R2 dans votre compte Cloudflare
2. Créer un bucket `bilnov-files`
3. Créer des clés API R2 (Access Key + Secret)

### 3. Accélération BDD — Cloudflare Hyperdrive

1. Dans Cloudflare Dashboard → Workers & Pages → Hyperdrive
2. Connecter votre base Neon
3. Récupérer l'URL Hyperdrive

### 4. Variables d'environnement sur Vercel

Dans Vercel → Settings → Environment Variables, ajouter :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL Cloudflare Hyperdrive |
| `DIRECT_DATABASE_URL` | URL Neon directe |
| `JWT_SECRET` | Secret aléatoire min. 32 chars |
| `STORAGE_ENDPOINT` | `https://<ID>.r2.cloudflarestorage.com` |
| `STORAGE_ACCESS_KEY` | Clé R2 |
| `STORAGE_SECRET_KEY` | Secret R2 |
| `STORAGE_BUCKET` | `bilnov-files` |
| `STORAGE_REGION` | `auto` |
| `RESEND_API_KEY` | Clé Resend |
| `NODE_ENV` | `production` |

### 5. Déployer sur Vercel

```bash
# Via CLI
npx vercel --prod

# Ou connecter le repo GitHub à Vercel (recommandé)
# vercel.com → New Project → Import GitHub repo
```

### 6. Migration en production

```bash
DATABASE_URL="<NEON_URL>" pnpm db:migrate:prod
```

---

## Structure du projet

```
bilnov/
├── apps/
│   ├── web/          # Next.js 14 — Frontend
│   └── api/          # NestJS — API REST
│       └── api/      # Handler Vercel serverless
├── packages/
│   ├── database/     # Prisma schema + migrations + seed
│   └── shared/       # Types et constantes partagés
├── infrastructure/   # Docker Compose (dev local)
├── vercel.json       # Configuration Vercel
└── turbo.json        # Monorepo configuration
```

---

## Commandes utiles

```bash
pnpm dev              # Démarrer en développement
pnpm build            # Build production
pnpm db:migrate       # Migrer la BDD (dev)
pnpm db:migrate:prod  # Migrer la BDD (prod)
pnpm db:seed          # Seeder les données de test
pnpm db:studio        # Ouvrir Prisma Studio
pnpm infra:up         # Démarrer Docker (PostgreSQL + Redis + MinIO)
pnpm infra:down       # Arrêter Docker
```
