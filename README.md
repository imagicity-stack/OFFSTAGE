# Off Stage Productions — website + Backstage admin

Next.js 16 (App Router) site, hosted on **Vercel**, with **Firebase** for the backend:

| Part | What it does |
| --- | --- |
| `/` | The one-page site from the Claude Design handoff: hero with spotlight, marquee, services, **Recent nights** (live from Firestore, filterable by category), process, and the enquiry form. |
| `/work/<event>` | Event page with the full photo gallery and a lightbox. |
| `/legal/*` | Privacy, Terms, Refund & Cancellation, Cookies, Disclaimer. |
| `/admin` | **Backstage**, the admin portal: sign in, manage categories, create and edit events, upload and order photos, pick the cover, publish or unpublish, read enquiries. |

The original design bundle lives in `project/` and `chats/` for reference only; it is not part of the build.

## How the pieces fit

- **Login.** The allowed admin email(s) come from the Vercel env var `NEXT_PUBLIC_ADMIN_EMAILS`. The password is checked by **Firebase Authentication** (Email/Password); it is never stored in the app or in Vercel. Any other account is refused and signed out. Password reset works from the login screen.
- **Data** is in Cloud Firestore:
  - `categories/{id}`: `name`, `order`
  - `events/{slug}`: `title, categoryId, categoryName, meta, description, date, location, cover, photos[], published, order`
  - `enquiries/{id}`: messages from the contact form
- **Photos** go to the Firebase Storage bucket under `events/<slug>/…`. The browser resizes large photos to at most 2400px before upload.
- **Security** is enforced by `firestore.rules` and `storage.rules`. Anyone can read categories, published events and photos. Only admin emails can write. The public can only *create* validated enquiries.
- **Public pages** read Firestore on the server (REST, with ISR every 60 s). Changes made in Backstage show on the site within about a minute.

## Setup

### 1. Firebase (one time)
1. Create a project at <https://console.firebase.google.com>, then add a **Web app** and copy its config.
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Authentication → Users → Add user.** Create the admin account (for example `admin@offstagepr.in`) with a strong password. Create this **before** going live.
4. **Authentication → Settings → User actions →** untick **Enable create (sign-up)**, so nobody else can register accounts.
5. Create a **Firestore database** (production mode) and **Storage** (new projects need the Blaze pay-as-you-go plan for Storage; normal use sits in the free allowance).
6. Deploy the security rules with your admin email(s) filled in:
   ```bash
   cp .env.example .env.local      # fill in the values
   npm run rules                   # writes firestore.rules + storage.rules from NEXT_PUBLIC_ADMIN_EMAILS
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,storage --project <your-project-id>
   ```
   Re-run these two commands whenever you change the admin email list.

### 2. Vercel
Import the repo in Vercel (framework: Next.js) and add these environment variables (see `.env.example`):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_ADMIN_EMAILS        # e.g. admin@offstagepr.in  (comma-separated for several)
NEXT_PUBLIC_SITE_URL            # optional, e.g. https://offstagepr.in
```

Then add your Vercel domain (and custom domain) under **Firebase → Authentication → Settings → Authorized domains**.

### 3. First run in Backstage
1. Go to `/admin` and sign in.
2. **Categories →** add e.g. *Events* and *Productions* (they become the filter buttons on the site).
3. **Events → + Add event →** fill in the details, then **Create event & add photos**.
4. Drop photos in, choose a cover, tick **Published** and **Save changes**.

## Local development

```bash
npm install
npm run dev                     # http://localhost:3000, using the Firebase project in .env.local
```

Or run fully offline against the Firebase emulators (needs Java):

```bash
# .env.local: NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-offstage, NEXT_PUBLIC_USE_FIREBASE_EMULATORS=1, any API key
npm run rules
npx firebase-tools emulators:start --project demo-offstage --only auth,firestore,storage
npm run dev
```

## Still to do before launch (from the design chat)
- Name a **Grievance Officer** in the Privacy Policy (`lib/legal-content.tsx`). Indian IT rules require one.
- Have a lawyer review the legal pages and the refund percentages.
