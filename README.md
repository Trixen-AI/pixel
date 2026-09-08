# Pixel Dividend

A 32×32 board game on Robinhood Chain. 1,024 tiles, one NFT each. Every tile is
staked to a real tokenized stock, and the treasury's yield is paid out per tile.

Research brief (verified addresses, where the yield comes from, game loop,
design system): [docs/research-brief.html](docs/research-brief.html).

## Run

```sh
npm install
npm run dev        # http://localhost:5173
```

The game is playable immediately. Wallet connect is optional:

```sh
cp .env.example .env
# set VITE_REOWN_PROJECT_ID from https://dashboard.reown.com
```

Without a project id the wallet button reads "Wallet off" and everything else
still works, including the live chain reads.

## What is live and what is demo

| Surface | Source |
|---|---|
| `uiMultiplier()` next to each ticker | **Live** — read from the real stock token contracts on Robinhood Chain (4663) via Multicall3, refreshed every 60s |
| Block number in the ticker rail | **Live** |
| Contract addresses | **Verified** — every one beacon-checked against the chain, see `src/config/tokens.ts` |
| Tile ownership, round prices, settlement, ledger | **Demo** — lives in `localStorage`, contracts are not deployed yet |

The demo/live split is deliberate: the multiplier is the one mechanism that
makes "pixels pay real yield" true, so it is shown from the chain from day one.
Everything that needs a deployed contract is behind `src/game/engine.ts` and can
be swapped without touching the UI.

## Scripts

```sh
npm run dev             # Vite dev server
npm run build           # tsc -b && vite build
npm run preview         # serve dist/
npm run verify:tokens   # re-check all 50 token addresses against the chain
```

Run `verify:tokens` before every release. The token beacon is upgradeable; a
registry that was right in September can be wrong in December. It exits
non-zero on any mismatch so it can gate CI.

## Deploy

Live at **https://pixeldividend.com** — Netlify, built from `main`.

`netlify.toml` already carries the build command, publish directory, Node
version, SPA fallback and cache headers, so a fresh Netlify site needs nothing
configured by hand except the two things below.

**1. Environment variable.** Vite inlines `VITE_*` at build time, so it must
exist on Netlify, not just in your local `.env` (which is gitignored and never
pushed):

| Key | Value |
|---|---|
| `VITE_REOWN_PROJECT_ID` | your id from https://dashboard.reown.com |
| `VITE_RPC_URL` | optional; a paid Robinhood Chain endpoint |

Set it under *Site configuration → Environment variables*, then redeploy —
Netlify does not rebuild on a variable change on its own. Without it the site
still deploys and the board still plays; only the wallet button goes quiet.

**2. Domain.** In *Domain management*, add `pixeldividend.com` and set it as the
primary domain. Netlify then redirects `www` to the apex by itself, which is why
`netlify.toml` has no hand-written `www` rule — a manual one would fight it.

DNS, whichever the registrar supports:

```
# Netlify DNS (simplest — point the nameservers at Netlify)
NS    pixeldividend.com    dns1..dns4.p0X.nsone.net

# or external DNS
ALIAS/ANAME  pixeldividend.com  ->  <site>.netlify.app
CNAME        www               ->  <site>.netlify.app
```

Use `ALIAS`/`ANAME`/flattened-CNAME for the apex if the registrar offers it; a
plain `A` record to a fixed IP is the fallback Netlify documents, and it is the
one that ages badly.

**3. Reown allowlist.** This one is easy to miss and fails silently in
production: add `https://pixeldividend.com` to the allowed domains for the
project id in the Reown dashboard. Until you do, WalletConnect rejects the
origin and the connect modal opens to nothing.

### Checks before shipping

```sh
npm run verify:tokens   # all 50 addresses still beacon-check against the chain
npm run build           # tsc -b && vite build
npm run preview         # serve dist/ exactly as Netlify will
```

## Layout

```
src/
  config/     chain.ts (defineChain 4663), tokens.ts (verified registry), wallet.ts (Reown + wagmi)
  chain/      abi.ts, useMultipliers.ts — the live reads
  game/       types.ts, engine.ts (pure rules), useGame.ts (state + persistence)
  render/     board.ts — canvas painter, Bayer dither, territory outlines
  components/ BoardView, TickerRail, TilePanel, RoundPanel, LedgerPanel, WalletButton, HowToPlay
  styles/     global.css — the 1-bit system
scripts/      verify-tokens.mjs
docs/         research-brief.html, verified-tokens.json
```

## Rules that hold the design together

- No accent hue anywhere. Emphasis is inversion; quantity is dither density;
  status is fill pattern (solid = real, hatched = demo/suspect).
- Press Start 2P for display only; VT323 for body; JetBrains Mono for every
  address and number, because a person copying an address must tell `0` from `O`.
- Nothing on screen is ever labelled an APY. Say *pass-through*.

## Known gaps

- Chainlink feed proxies for the Phase 1 tickers are not wired in; round
  performance is simulated (`rollPerformance` in `engine.ts`). The
  `aggregatorV3Abi` and a slot for addresses are ready in `src/chain/abi.ts`.
- The public RPC is rate-limited and one node behind its load balancer has
  served an expired TLS certificate. Set `VITE_RPC_URL` to a paid endpoint
  before launch.
- Main JS chunk is ~1.25 MB because of Reown AppKit. Code-split it before
  shipping.
