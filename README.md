# ShareIt

Share files, text, and URLs. Encrypted at rest. Auto-expires.

## Quick start

```bash
npm install
npm start
```

That's it. `npm start` does everything:

1. Generates AES-256 encryption key (writes to `wrangler.toml`)
2. Creates D1 database (parses and writes `database_id` to `wrangler.toml`)
3. Initializes the SQL schema (local + remote)
4. Starts the dev server

First run needs `npx wrangler login` so the CLI can create the D1 database.

## Stack

- Cloudflare Pages + Functions
- D1 (SQLite) for storage
- AES-256-GCM encryption via Web Crypto API
- QR code via QRious

## Routes

| Route        | Purpose                     |
|--------------|-----------------------------|
| `/f/:id`     | Shared file                 |
| `/t/:id`     | Shared text                 |
| `/u/:id`     | Shared URL (interstitial)   |
| `/api/create`| Create share (POST)         |

IDs are 8-char alphanumeric (`[a-zA-Z0-9]{8}`).

## Deploy to Cloudflare Pages

After `npm start` has generated the key, deploy:

```bash
npm run deploy
```

Then in the Cloudflare dashboard:
- Bind D1: Pages → shareit → Settings → Functions → D1 database bindings → `DB` → `shareit-db`
- Set secret: `npx wrangler pages secret put ENCRYPTION_KEY` (use the key printed by `npm start`)

Or via GitHub:
1. Push repo to GitHub
2. Cloudflare dashboard → Pages → Create project → Connect to Git
3. Build settings: **No build command**, output directory: `public`
4. Settings → Functions → D1 database bindings → add `DB` → `shareit-db`
5. Settings → Environment variables → add secret `ENCRYPTION_KEY`

## Limits

- Files: max 4MB
- Text: max 512KB
- URLs: validated, must be proper `https://` or `http://`
- Expiry: 1h / 6h / 1d / 3d / 7d
- Expired shares are deleted on access (lazy cleanup)
