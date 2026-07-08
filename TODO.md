# Project TODO List — Hora Staycation

This document tracks pending tasks and configurations for deployment and operations.

## High Priority

- [ ] **Configure Stripe Webhook**
  - **Goal:** Enable automatic booking confirmation and refund handling without depending on client-side redirects.
  - **Steps:**
    1. Go to the **Stripe Dashboard** → **Developers** → **Webhooks**.
    2. Click **Add Endpoint** and point it to: `https://horastaycation.com/api/stripe-webhook`
    3. Listen to the following events:
       - `checkout.session.completed`
       - `charge.refunded`
    4. Copy the webhook signing secret (starts with `whsec_...`).
    5. Add it to Vercel Environment Variables as `STRIPE_WEBHOOK_SECRET` for the **Production** environment.
    6. Redeploy or promote the build in Vercel to apply the new environment variable.

## Post-Launch Operations

- [ ] **Monitor Resend Email Limits**
  - The Resend integration currently runs on the **Free Tier** (limited to 100 emails per day / 3,000 per month).
  - If daily bookings/leads exceed this volume, consider upgrading the Resend plan.
- [ ] **Set Up Sender Profile Picture (BIMI / Gravatar)**
  - Add a profile photo/logo for `noreply@horastaycation.com` via **Gravatar** or configure a **BIMI** DNS TXT record for full branding in Gmail/Yahoo Mail.
