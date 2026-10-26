# RUNEBLADE

A fully pixel art medieval fantasy typing game. Thai, English, JavaScript and Python word modes; five increasingly difficult stages; five hearts; animated attacks, combo scoring, WPM and accuracy. Account sign-in uses the Sites platform's ChatGPT identity. Runs are stored per user in Cloudflare D1. Guest history stays on the current device.

## Develop

```powershell
npm ci
npm run db:generate # only after schema changes
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_ordinary_sumo.sql
npm run dev
```

Apply each pending migration once; do not replay the initial migration. The local sign-in route simulates a development user on loopback only. Production sign-in is owned by Sites, not an email/password service in this repository. The site is owner-private until access is explicitly changed.

## Verify

```powershell
npm run typecheck
npm test
npm run build
```

Game engine: `lib/game.ts`. Interface: `components/game/`. Account API: `app/api/runs/route.ts`. Visual system: `DESIGN.md` and `app/globals.css`. Behavior: `UX-CONTRACT.md`. Artwork and font credits: `docs/ASSETS.md`.

Practice scores are client-reported personal records, not verified competitive leaderboard scores. WPM counts completed-word characters divided by five, per active minute. Pause time is excluded. Accuracy counts correctly entered prefix characters versus all added characters, including errors corrected later.
