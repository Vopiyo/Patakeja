# PataKeja 🏠

**PataKeja** ("*pata keja*" — Sheng for "find your pad") is a house-hunting web app for Kenyan cities and towns, built to fix the specific complaints renters and landlords have about existing platforms: hidden viewing fees, unverified agents, shallow search filters, and zero context about the neighbourhood.

This version has a real backend — accounts, a database, and photo storage via [Supabase](https://supabase.com) — so listings, favourites, and photos all persist for real, across devices and sessions.

---

## Live demo

`[Add your deployed URL here once published — see Deployment below]`

---

## The problem

Across the most-used house-hunting platforms in Kenya (BuyRentKenya, PigiaMe, Jiji, HouseHunt Kenya, KenyaHomesHub, Housa, Property24, and others), the same complaints come up repeatedly:

| Common problem | PataKeja's answer |
|---|---|
| "Convenience fees" of up to Ksh 5,000 just to unlock a contact | Every phone number is visible for free — one-tap **Call** and **WhatsApp** buttons on every listing |
| Agents posing as landlords; fake or duplicate listings | A **Verified** stamp on confirmed listings, plus one-tap **Report this listing** on every card |
| Search rarely goes deeper than "house" vs "apartment" | Filter by exact size (Bedsitter → 4+ Bedroom), price range, town, and estate, all together |
| A photo and a price, nothing about the area | Each listing has a **neighbourhood snapshot**: distance to CBD, nearest matatu stage, community-reported water and security ratings |
| Landlords pay commission per tenant placed | Posting is free with **no commission** |
| Listings with no photos waste a hunter's time | A full **photo carousel** per listing, with a real upload flow when posting |
| Saved listings disappear when you close the tab | Accounts sync favourites and your own listings across devices |

## Features

- 🔍 **Search & filter** — free-text search by estate/town, filter by size, price range, town, verified-only, and no-viewing-fee-only, with sort by price or newest
- 🔐 **Real accounts** — email/password sign-up and sign-in via Supabase Auth, with a profile (name, phone, role) used to prefill your listings
- 📸 **Photos** — photo carousel with thumbnails on every listing; real photo upload to Supabase Storage when posting
- 📞 **Direct contact** — `tel:` and `wa.me` links straight to the landlord, agent, or caretaker — no login wall to browse
- ❤️ **Save listings** — favourites are stored per account and sync across devices
- 🏷️ **Post & manage listings** — a free posting flow, plus a "My listings" tab to see and delete what you've posted
- 💳 **Paid plans via M-Pesa** — a freemium model (1 free listing; Standard/Pro plans unlock more listings and better placement), paid via M-Pesa STK Push through IntaSend
- 🛡️ **Trust signals** — verified stamps, no-fee badges, and a reporting flow baked into the UI
- 📱 **Mobile-first** — bottom tab navigation on small screens, responsive grid on desktop

## Tech stack

- **React** (functional components, hooks)
- **[Supabase](https://supabase.com)** — Postgres database, Auth, and Storage
- **[lucide-react](https://lucide.dev/)** for icons
- **Vite** for the dev server and build
- Inline styles + a small custom design-token system (no CSS framework dependency)
- **Google Fonts**: Archivo Black, Space Grotesk, Inter, IBM Plex Mono
- **[Lorem Picsum](https://picsum.photos/)** for placeholder photography in the optional sample data

## Project structure

```
patakeja/
├── src/
│   ├── main.jsx                  # Vite entry point
│   ├── App.jsx                   # top-level app: layout, search/filter, tabs
│   ├── lib/supabaseClient.js     # Supabase client + storage bucket name
│   ├── hooks/
│   │   ├── useAuth.jsx           # auth context: session, profile, sign in/up/out
│   │   └── useSubscription.jsx   # loads the signed-in user's current plan
│   ├── data/
│   │   ├── theme.js              # design tokens, sizes, amenities, formatters
│   │   └── plans.js              # plan display data (free/standard/pro)
│   └── components/
│       ├── shared.jsx            # PriceTag, VerifiedStamp, Pill
│       ├── AuthModal.jsx         # sign in / create account
│       ├── ListingCard.jsx       # grid card
│       ├── ListingModal.jsx      # detail view + carousel + report/delete
│       ├── PostModal.jsx         # post-a-listing form + photo upload
│       └── UpgradeModal.jsx      # plan picker + M-Pesa STK push + polling
├── supabase/
│   ├── schema.sql                 # core tables, RLS policies, storage policies
│   ├── schema_billing.sql         # subscriptions + payments tables
│   ├── seed.sql                   # optional sample listings
│   └── functions/
│       ├── initiate-payment/      # Edge Function: starts an M-Pesa STK push
│       └── intasend-webhook/      # Edge Function: activates plan on payment success
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── README.md
```

## Backend setup (Supabase)

You need your own free Supabase project — nothing is shared between deployments.

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is enough).
2. **Run the schema.** Dashboard → SQL Editor → New query → paste the contents of `supabase/schema.sql` → Run. This creates the `profiles`, `listings`, `favorites`, and `reports` tables with row-level security policies already locked down (see [Security notes](#security-notes)).
3. **Create the photo storage bucket.** Dashboard → Storage → New bucket → name it exactly `listing-photos` → mark it **Public**. Then re-open the SQL editor and run just the storage policy section at the bottom of `schema.sql` (the three `create policy ... on storage.objects` statements) — this has to happen after the bucket exists.
4. **(Optional) Seed sample listings.** Run `supabase/seed.sql` to pre-populate 16 example listings across Nairobi, Nakuru, Mombasa, Kisumu, and Eldoret, so the app isn't empty on first load. These are unowned (no delete button shows for them) and safe to remove later with `delete from listings where owner_id is null;`.
5. **Turn off email confirmation for faster local testing (optional).** Dashboard → Authentication → Providers → Email → toggle off "Confirm email". With it on, new users must click a link in their inbox before they can sign in — fine for production, slower for testing.
6. **Get your API keys.** Dashboard → Project Settings → API → copy the **Project URL** and the **anon public** key.

## Getting started locally

**Requirements:** [Node.js](https://nodejs.org/) (LTS) and npm, plus a Supabase project set up as above.

```bash
# 1. Install dependencies
npm install

# 2. Add your Supabase credentials
cp .env.example .env
# then edit .env and paste in your Project URL and anon key

# 3. Run it
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173/`). Create an account via "Sign in" → "Create account" to try posting a listing.

## Deployment

This is a static Vite app that talks directly to Supabase from the browser, so any static host works.

### Vercel
1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), **New Project**, import the repo.
3. Framework preset: **Vite**. Leave build command (`npm run build`) and output directory (`dist`) as default.
4. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project Settings → Environment Variables.
5. Deploy — Vercel gives you a live URL and redeploys automatically on every push.

### Netlify
1. Push this project to a GitHub repo.
2. Go to [netlify.com](https://netlify.com), **Add new site → Import an existing project**.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Site settings → Environment variables.
5. Deploy.

Whichever host you use, also add your deployed domain to Supabase's **Authentication → URL Configuration → Redirect URLs** if you enable email confirmation, so confirmation links point back to the right place.

## Security notes

- The `anon` key is meant to be public — it's safe to ship in the browser bundle. All real protection comes from the row-level security (RLS) policies in `schema.sql`, which is why they're worth reading, not just running.
- Anyone can **read** listings and profiles (it's a public directory), but only the owner (`auth.uid() = owner_id`) can **insert, update, or delete** their own listings, and only the account holder can read or write their own favourites.
- Photo uploads are restricted to a folder named after the uploader's own user id, so one user can't overwrite another's photos.
- `reports` only allows inserts from the client — reviewing them is meant to happen from the Supabase dashboard's Table Editor, not from the app itself, until you build an admin view.

## Monetization / M-Pesa payments

PataKeja uses a freemium model: browsing and contacting stays free for everyone (that's the whole point of the app), but posting more than one active listing at a time requires a paid plan. Payment is collected via M-Pesa STK Push, using [IntaSend](https://intasend.com) as the payment aggregator (no need for your own Safaricom Paybill/Till to get started).

| Plan | Price | Active listings | Placement |
|---|---|---|---|
| Free | Ksh 0 | 1 | Standard |
| Standard | Ksh 300/mo | 10 | Standard |
| Pro | Ksh 1,000/mo | Unlimited | Featured, top of results |

**These prices are a starting point, not a validated number** — test them with real landlords/agents before treating them as final.

### How it works

- `subscriptions` table holds each user's current plan; `payments` logs every M-Pesa attempt. Both are read-only from the client — only the Edge Functions (using the service role key) can write to them, so a user can't grant themselves "Pro" by tampering with a client-side request.
- **`initiate-payment`** Edge Function: called when a user picks a paid plan. Looks up the price server-side (never trusts a price from the client), logs a pending payment, and calls IntaSend's M-Pesa STK Push API so the user gets a payment prompt on their phone.
- **`intasend-webhook`** Edge Function: IntaSend calls this when the payment's status changes. On success, it activates the user's subscription for 30 days.
- The client polls the `payments` table every few seconds after initiating payment, to show "check your phone" → "you're upgraded" without needing a page refresh.

### Setup

1. **Create an IntaSend account** at [intasend.com](https://intasend.com) and grab your **sandbox** publishable + secret keys from the dashboard (use sandbox until you're ready to take real money).
2. **Run the billing schema.** SQL Editor → paste `supabase/schema_billing.sql` → Run.
3. **Install the Supabase CLI** if you don't have it: `npm install -g supabase`.
4. **Link your project:** `supabase login` then `supabase link --project-ref your-project-ref` (find the ref in your Project URL).
5. **Set Edge Function secrets:**
   ```bash
   supabase secrets set INTASEND_SECRET_KEY=your-sandbox-secret-key
   supabase secrets set INTASEND_ENV=sandbox
   supabase secrets set INTASEND_WEBHOOK_CHALLENGE=some-random-string-you-invent
   ```
6. **Deploy the functions:**
   ```bash
   supabase functions deploy initiate-payment
   supabase functions deploy intasend-webhook --no-verify-jwt
   ```
7. **Register the webhook.** In IntaSend's dashboard → Webhooks, add your deployed `intasend-webhook` function URL (Supabase prints it after deploying, looks like `https://your-project-ref.supabase.co/functions/v1/intasend-webhook`) and set the same challenge string from step 5.
8. **Test it.** In the app, click "Upgrade" — IntaSend's sandbox lets you simulate a completed payment without real money. Once it works end-to-end, switch `INTASEND_ENV` to `live` and use your live keys.

**Before this collects real money:** verify the exact response/webhook field names against IntaSend's current docs (`developers.intasend.com`) — API responses can shift between versions, and the code has comments flagging the fields most likely to need adjustment.

## Roadmap / next steps

- **Listing verification workflow** — right now "Verified" is just a boolean column; a real product needs an admin review step (ID or title-deed check) before flipping it on
- **Edit listings** — the "My listings" tab currently supports delete only; editing would reuse the `PostModal` form pre-filled with existing values
- **Real neighbourhood data** — replace the manually-entered CBD-distance/water/security ratings with sourced data or crowdsourced reviews
- **Maps** — plot listings on an actual map (Google Maps or Mapbox) instead of text-only location fields
- **Notifications** — alert hunters when a new listing matches their saved search criteria (Supabase Edge Functions + a cron job would fit well)
- **Native app** — wrap in React Native or Capacitor for an installable mobile app

## Credits

Concept, design, and build by **Victor Otieno Opiyo**. Sample listings and phone numbers in `seed.sql` are entirely fictional, for demonstration purposes only.

## License

`[Add a license here, e.g. MIT, if you plan to open-source this — otherwise remove this section]`
