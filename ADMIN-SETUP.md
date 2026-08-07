# Admin Panel Setup Guide

Your site now has a full admin panel (`admin.html`) backed by a free
[Supabase](https://supabase.com) database. Changes made in the admin
panel appear on the live site **instantly**, for every visitor — no
redeploy needed.

Do this once. It takes about 10–15 minutes.

## 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is enough).
2. Click **New Project**. Pick any name/region, set a database password
   (save it somewhere — you likely won't need it again), and wait ~2
   minutes for it to spin up.

## 2. Create the database tables

1. In your new project, open **SQL Editor** (left sidebar).
2. Click **New query**, paste in the entire contents of
   `supabase/schema.sql` from this project, and click **Run**.
   This creates all the tables, security rules, and the photo storage bucket.
3. New query again, paste in the entire contents of
   `supabase/seed_data.sql`, and click **Run**.
   This loads your current real club/table/fixtures/scorers/squad/news
   data, so the site looks exactly like it does now once connected.

## 3. Create your admin login

1. Go to **Authentication → Users** (left sidebar).
2. Click **Add user → Create new user**.
3. Enter an email and password for yourself. Toggle **Auto Confirm User**
   to ON. Click **Create user**.
4. This email/password is what you'll use to log into `admin.html`.
   You can add more admin users the same way later.

## 4. Connect the site to your project

1. Go to **Project Settings → API** (left sidebar, gear icon).
2. Copy the **Project URL** and the **anon / public** key.
3. Open `js/supabase-client.js` in this project and paste them in:

   ```js
   const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
4. Save, commit, and push:
   ```
   git add .
   git commit -m "Connect site to Supabase backend"
   git push
   ```

The anon key is safe to publish — it's a public key by design. Security
is enforced by the database rules in `schema.sql` (anyone can read;
only a logged-in admin can write). **Never** put a `service_role` key
anywhere in this project.

## 5. Upload your existing gallery photos

The 17 matchday photos that used to be built into the site are now in
`supabase/seed-photos/` instead. Once steps 1–4 are done:

1. Open `admin.html` on your live site and log in.
2. Go to the **Gallery** tab.
3. Select all 17 files from `supabase/seed-photos/` and upload.

## 6. You're live

Visit `yoursite.com/admin.html`, log in, and you can now manage:

- **Clubs** — add/edit/remove clubs
- **Table** — update P/W/D/L/goals after each matchday (points & rank
  are calculated automatically)
- **Fixtures** — add upcoming matches; they auto-switch to "Played"
  once the date passes
- **Scorers** — Golden Boot standings
- **Squads** — team rosters
- **News** — write and publish news posts
- **Gallery** — upload/delete matchday photos, edit captions
- **Settings** — season label and "as of" text shown around the site

Every change shows up on the public site immediately, for everyone
currently browsing it — no refresh required (thanks to Supabase
Realtime).

## Notes

- The admin link is a small "Admin" link in the site footer, or just
  go straight to `/admin.html`.
- `admin.html` has `<meta name="robots" content="noindex, nofollow">`
  so it won't show up in search engines, but it isn't secret — the URL
  itself isn't a security boundary, the login is. Don't share the
  admin URL publicly if you'd rather keep it low-profile, though
  anyone without your login credentials can't change anything either way.
- Free Supabase projects pause after a week of no API activity — the
  first request after a pause takes a few extra seconds to wake back
  up, then it's normal.

## Admin self-registration & password reset

The admin panel now has "Create an account" and "Forgot password?"
links on the login screen. One extra setup step is needed for this:

1. **SQL Editor → New query**, paste in the entire contents of
   `supabase/admin-approval-system.sql`, and click **Run**.
   This adds an approval system: anyone who registers can log in, but
   can't change anything on the site until an *existing* admin approves
   them from the new **Admins** tab. Whoever already has a login (you)
   gets auto-approved by this script — no action needed on your end.

2. **Set your site's URL in Supabase**, so password-reset email links
   point to the right place:
   - **Authentication → URL Configuration**
   - Set **Site URL** to your live Netlify URL, e.g.
     `https://mtwapa-premier-league.netlify.app`
   - Under **Redirect URLs**, add the same URL with `/admin.html` on
     the end, e.g. `https://mtwapa-premier-league.netlify.app/admin.html`

3. That's it. New registrations show up as **Pending** in the Admins
   tab until you click **Approve**. You can also **Revoke** an admin's
   access at any time from the same tab.

**Note on email sending:** Supabase's free tier sends confirmation and
password-reset emails using its own shared mail service, which is fine
for testing but can be rate-limited or land in spam for real use. If
that becomes a problem, Supabase's docs explain how to connect your
own SMTP provider (Authentication → Emails → SMTP Settings) — not
needed to get started, just worth knowing about later.

## Gallery albums (photo folders)

The Gallery is now organized into albums (folders) by event/matchday,
instead of one long flat list of photos.

1. **SQL Editor → New query**, paste in the entire contents of
   `supabase/gallery-albums.sql`, and click **Run**. This adds the
   albums table and automatically creates a starter "Matchday Photos"
   album containing any photos you'd already uploaded, so nothing
   disappears.
2. In `admin.html` → **Gallery** tab, you'll now see an **Albums**
   section — add an album (e.g. "Season Opener", "Mikanjuni vs Bahari
   United") before uploading photos into it.
3. When uploading, pick the album from the dropdown first.
4. Existing photos can be moved between albums anytime — each photo in
   the "All Photos" section has its own album dropdown.
5. On the public site, the Gallery page now shows album folders first;
   clicking one opens that album's photos with the same tap-to-enlarge
   viewer as before.

Albums with no photos in them are hidden from the public site
automatically (so an empty album you're still filling up won't show
as a dead folder to visitors) — they still show in admin so you can
keep adding to them.

