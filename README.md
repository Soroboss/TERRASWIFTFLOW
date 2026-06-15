# TerraSwiftFlow — Démarrage local

## 1. Variables d'environnement

```bash
cp .env.local.example .env.local
```

Renseignez les 3 clés depuis [supabase.com/dashboard](https://supabase.com/dashboard) → **Settings → API**.

## 2. Base de données

Dans Supabase → **SQL Editor**, exécutez :

```
supabase/full_schema.sql
```

## 3. Lancer

```bash
npm install
npm run setup:check   # vérifie la config
npm run dev           # http://localhost:3000
```

## Parcours de test

1. **/** — Landing page
2. **/register** — Créer votre entreprise (essai 14 jours)
3. **/dashboard/plans/nouveau** — Plan de masse
4. **/dashboard/biens/nouveau** — Terrains avec n° de lot
5. **/dashboard/clients/nouveau** — Clients
6. **/dashboard/deals/nouveau** — Vente + échéancier + versement PDF

Guide détaillé : **http://localhost:3000/setup**
