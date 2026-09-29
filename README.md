# Hora Staycation

Hora Staycation is a React/Vite booking experience with Supabase-backed listings, Stripe Checkout, Resend notifications, and a management portal.

## Local development

```bash
npm install
copy .env.example .env
npm run dev
```

Use `npm run check-env` to verify required variables. Keep Stripe secret and webhook keys server-side; never prefix them with `VITE_`.

## Verification

```bash
npm run check
```

The check runs linting, the Vitest suite, and a production build. Payment state is finalized by the signed Stripe webhook and is idempotent for duplicate deliveries. Configure the production endpoint by following [TODO.md](./TODO.md) and [STRIPE_SETUP.md](./STRIPE_SETUP.md).

## Project structure

- `src/` — guest booking UI, management portal, validation, and client services
- `api/` — server-side checkout, webhook, refund, email, and auth handlers
- `supabase/` — database migrations
- `public/` — static assets

## Scope and limitations

This project is a deployment-ready portfolio application. Production use still requires configuring Stripe, Supabase, Resend, sender-domain authentication, backups, and monitoring in the target environment.
