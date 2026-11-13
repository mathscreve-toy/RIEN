# Vigi Sector

Application de gestion des secteurs, plages et disponibilités des équipes LPS.

## Production

- Frontend React/Vite déployé sur Netlify.
- Authentification et données hébergées sur Supabase.
- Connexion réservée aux adresses `@sdis76.fr`.
- Première connexion par lien sécurisé, puis définition du mot de passe.
- Réinitialisation de mot de passe et sessions multi-appareils.
- Export CSV des disponibilités, compatible Excel.

## Variables de build

Copier `.env.example` vers `.env` et renseigner :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Ne jamais utiliser de clé `service_role` dans le frontend.

## Développement

```bash
npm install
npm run dev
```

## Déploiement

La configuration Netlify se trouve dans `netlify.toml`. La migration initiale Supabase est versionnée dans `supabase/migrations`.
