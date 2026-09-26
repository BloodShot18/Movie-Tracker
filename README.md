# Tonight's Reel — Cloudflare deploy

A shared daily watch-log. Static page in `public/`, API in `functions/api/entries.js`
(a Cloudflare Pages Function), data in D1 (Cloudflare's SQLite).

## One-time setup

```bash
npm install -g wrangler   # if you don't have it
wrangler login
```

### 1. Create the database

```bash
cd watch-log
wrangler d1 create watch-log-db
```

This prints a `database_id` — copy it into `wrangler.toml`, replacing
`REPLACE_WITH_YOUR_DATABASE_ID`.

### 2. Apply the schema

```bash
wrangler d1 execute watch-log-db --remote --file=./schema.sql
```

### 3. Deploy

```bash
wrangler pages deploy public --project-name=watch-log
```

First run will prompt you to create the Pages project. Wrangler picks up
`functions/` and the D1 binding from `wrangler.toml` automatically.

Your site is now live at `https://watch-log.pages.dev` (or whatever
project name you chose). Attach a free custom domain later from the
Cloudflare dashboard → Pages → your project → Custom domains.

## Local dev

```bash
wrangler d1 execute watch-log-db --local --file=./schema.sql
wrangler pages dev public
```

## How it works

- `public/index.html` — the whole UI. Polls `GET /api/entries?day=YYYY-MM-DD`
  every 6 seconds and posts new entries to `POST /api/entries`.
- `functions/api/entries.js` — the API, reading/writing the `entries` table
  in D1 via the `DB` binding.
- The feed shows a rolling 7-day window (anything logged in the last
  7 days). Older entries stay in the database, just fall out of the feed
  as new ones push past a week old.

## Notes / next steps if you want them

- **Polling, not push**: updates land within ~6 seconds, not instantly.
  True real-time would mean a Durable Object + WebSocket — more setup,
  can add later if it matters.
- **No auth**: anyone with the link can post as any name. Fine for a
  trusted group; add a shared passphrase or Cloudflare Access if not.
- **Rate limiting**: not included. Cloudflare's dashboard has basic rate
  limiting rules you can turn on for `/api/*` if it gets abused.
