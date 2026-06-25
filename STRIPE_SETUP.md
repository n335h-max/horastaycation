Stripe Setup and Safety

Important: Do NOT share Stripe secret keys in chat, issues, or commits.
If a secret key was shared publicly, rotate/regenerate it immediately in the Stripe Dashboard.

Local development

1. Create a `.env` or `.env.local` at the project root (do not commit it).
2. Add your keys:

   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...

3. Start the dev server (Vite):

   npm install
   npm run dev

4. For webhook testing use the Stripe CLI (recommended):

   stripe login
   stripe listen --forward-to "http://localhost:5173/api/stripe-webhook"

   This prints a webhook signing secret (whsec_...) which you should set in your local `.env`.

Deployment (Vercel)

- Set the following environment variables in your Vercel project settings (Production and Preview as appropriate):
  - `VITE_STRIPE_PUBLISHABLE_KEY` (publishable key)
  - `STRIPE_SECRET_KEY` (secret key — server only)
  - `STRIPE_WEBHOOK_SECRET` (webhook signing secret returned by Stripe when you create the webhook endpoint)

- Create a webhook in the Stripe Dashboard pointing to `https://<your-deployment>/api/stripe-webhook` and copy the signing secret into Vercel's `STRIPE_WEBHOOK_SECRET`.

Security and rotation

- Treat `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as secrets. Never check them into version control or paste them into public chats.
- If you shared a secret (for example, posted it in chat), rotate it immediately:
  1. Open https://dashboard.stripe.com/apikeys and revoke the leaked key.
  2. Create a new secret key and update your deployment and local `.env`.
  3. If a webhook secret was leaked, delete the webhook and recreate it to get a new signing secret.

Testing flow

1. Create a booking in the app and proceed to payment; the client will POST to `/api/create-checkout-session`.
2. The server uses `STRIPE_SECRET_KEY` to create a hosted Checkout session and returns `session.url`.
3. The browser redirects to Stripe Checkout; complete payment with test cards or live cards depending on your keys.
4. After success Stripe redirects back to `/booking/success?session_id=...`.
5. The app calls `/api/verify-checkout-session?session_id=...` to confirm payment and then finalizes booking.

If you want, I can:
- Add a short check on startup that warns if `STRIPE_SECRET_KEY` is missing.
- Help you rotate the leaked secret (I cannot do this for you — must be done in your Stripe Dashboard).

Contact me which of the above you'd like me to implement next.
