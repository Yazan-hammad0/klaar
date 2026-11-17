# Accounts (Supabase)

GitHub Pages and Cloudflare Pages only serve files. They cannot keep accounts. So Klaar uses a free Supabase project for them: one account per email with a password, and one saved copy of the learner's progress per account.

Accounts are optional. Without one, Klaar works exactly as before, fully offline, with progress on the phone only.

| File | What it does |
|---|---|
| `js/config.js` | The project address and public key. Empty means every account feature is hidden |
| `js/backend.js` | Talks to Supabase with plain `fetch`, no library |
| `js/sync.js` | Merges the phone's progress with the account copy, the sign-in sheet, sign out, delete account |

## How syncing works

- Progress always lives on the phone first (`klaarStateV1` in localStorage). The account holds a copy.
- Klaar syncs when you sign in, when the app opens while online, and about 20 seconds after you stop answering. If it fails (offline, server down), it tries again later without telling anyone.
- A sync never overwrites. It reads the account copy, merges it with the phone, and writes the result to both. Per question it keeps the latest answer; counts keep the higher number; settings (name, exam date, daily goal) come from the phone that changed something last. "Start again" on one phone wins over older progress.
- The sign-in tokens are kept in their own key (`klaarAuthV1`), never in the backup file.

## Why a password and not an emailed link

On Supabase's free built-in email sender, mail only reaches members of your own Supabase team. So a sign-in link or code cannot reach real learners. Klaar therefore uses email and password, with "Confirm email" turned off. The two costs: email addresses are not checked, and a forgotten password cannot be reset from the app yet.

To fix both later: add your own sender under **Authentication**, **Emails**, **SMTP Settings** (this needs the Klaar domain), turn **Confirm email** back on, and add a reset-password screen.

## Set it up (about 15 minutes)

### 1. Create the project

1. Go to https://supabase.com/dashboard and sign in with your existing account.
2. Click **New project**. If it asks for an organisation, pick the one you already have.
3. **Project name**: `klaar`. Do not reuse the Icon-Green project.
4. **Database password**: click **Generate a password** and save it in your password manager. The app never needs it.
5. **Region**: pick **Central EU (Frankfurt)** (or another EU region such as West EU (Ireland) or West EU (Paris)). The region must be in the EU, because the privacy page says so.
6. Click **Create new project** and wait until it says the project is ready (1 to 2 minutes).

### 2. Create the table and the rules

1. In the left menu click **SQL Editor**.
2. Click **New query** (or the **+**).
3. Paste all of this and click **Run** (bottom right). It should say "Success. No rows returned".

```sql
-- one row per account: the learner's progress as one JSON document
create table public.progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_size check (pg_column_size(data) < 1000000)
);

alter table public.progress enable row level security;

-- each signed-in person can read and write only their own row
create policy "read own progress" on public.progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "add own progress" on public.progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "change own progress" on public.progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "remove own progress" on public.progress for delete to authenticated
  using ((select auth.uid()) = user_id);

-- "Delete account" in the app: removes the signed-in person's login, and with it their progress row
create or replace function public.delete_me()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;
```

4. Check: in the left menu click **Table Editor**. You should see a table called `progress` with a small "RLS enabled" label (no red "Unrestricted" label).

### 3. Sign-in settings

1. Left menu: **Authentication**, then **Sign In / Providers** (under Configuration).
2. Under **User Signups**:
   - **Allow new users to sign up**: on.
   - **Confirm email**: off.
   - Click **Save changes**.
3. On the same page, open **Email** under Auth Providers and check it is enabled. Set **Minimum password length** to `8` if the field is there, and save.
4. Left menu: **Authentication**, then **URL Configuration**.
   - **Site URL**: `https://yazan-hammad0.github.io/klaar/` for now. Change it to the new domain after the move.
   - Click **Save changes**.
5. Optional but sensible: **Authentication**, **Rate Limits**. Leave the defaults.

### 4. Copy the two values

1. Left menu: **Project Settings** (the gear at the bottom), then **API Keys**.
2. Copy the **Publishable key** (starts with `sb_publishable_`). If your project only shows a **Legacy API keys** tab, copy the **anon public** key from there instead (a long text starting with `eyJ`).
3. Left menu: **Project Settings**, then **Data API** (or the **Connect** button at the top). Copy the **Project URL**. It looks like `https://abcdefghijkl.supabase.co`.
4. Send both to Claude, or paste them yourself into `js/config.js`:

   ```js
   window.KLAAR_CONFIG = {
     supabaseUrl: "https://abcdefghijkl.supabase.co",
     supabaseKey: "sb_publishable_..."
   };
   ```

The publishable (anon) key is meant to be public: the rules from step 2 protect the data. **Never** put the `service_role` key or a `sb_secret_` key in this file or anywhere in this repo. The repo is public.

### 5. Sign the data processing agreement (DPA)

The privacy page says Supabase stores data for Klaar under a data processing agreement. Make that true:

1. In the Supabase dashboard, open your **organisation** (top left), then **Settings**, then **Legal Documents**.
2. Find the **Data Processing Addendum (DPA)** and follow the steps to sign it (it is a PandaDoc form; it asks for the company name, which is `[Company name]` until the KVK change is done).
3. Save the signed PDF somewhere safe, outside this repo.

If your plan does not offer the DPA, tell Claude, and the privacy page line will be reworded.

### 6. Release

```bash
python3 release.py "Save your progress to a free account and use it on any phone"
```

Then commit and push. Open the app, open your profile (top right), tap **Save your progress**, and make an account. In Supabase, **Table Editor**, `progress` should now show one row.

## After the move to the new domain

1. On the old address: open the app, sign in (or check you are signed in), and let it sync once (profile says "Last saved ...").
2. On the new address: open the app. On the first setup screen tap **I already have an account**, or later go to your profile and tap **I already have an account**. Sign in. Your progress comes back.
3. In Supabase, **Authentication**, **URL Configuration**: change the Site URL to the new domain.

The Supabase project does not change with the domain. The same `js/config.js` works on both addresses.

## What is stored

| Where | What |
|---|---|
| `auth.users` (Supabase) | Email address, the password as a one-way hash, sign-in times |
| `progress` | The app state: answers per question, mock scores, streak days, settings, the first name if one was typed, exam dates |

To delete an account by hand: **Authentication**, **Users**, find the email, **Delete user**. The `progress` row goes with it. Learners can also do this themselves: profile, **Delete account**.

## Forgotten passwords

There is no reset in the app yet. Two options until there is:
- **Authentication**, **Users**, find the person, and use **Send password recovery** once you have your own SMTP sender, or
- delete the user and ask them to make a new account. The progress on their phone is kept, and their next sign-up uploads it again.

## Free plan limits

The free plan pauses a project after a week with no requests. Learners using the app keep it awake. If it is ever paused, open the project in the dashboard and click **Restore**; nobody loses progress, because every phone keeps its own copy.

## Turning it off

Empty the two values in `js/config.js`, run `release.py`, push. Every account feature disappears and progress stays on each phone, as before.
