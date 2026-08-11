# Snout

eBay price analysis PWA for UK sellers. Search active listings, compare prices, and track what sells.

## Features

- **Browse API search** — search active eBay UK listings with condition, price, sort, listing type, and UK-only filters
- **Sticky filters** — all filter settings persist in localStorage across searches and sessions
- **Price stats** — average, median, min, max across results (total price including P&P)
- **Item cards** — image, title, item price + shipping breakdown, condition badge, direct eBay link
- **Built-in presets** — one-tap quick modes: Competition (UK BIN cheapest first), Auctions (ending soonest), New Items (freshly listed)
- **Saved filters** — save and reload custom search presets (localStorage)
- **PWA** — installable, works offline (cached shell), mobile-first dark UI
- **Fee calculator** — UK eBay fees (12.8% + 30p) and profit estimation

## Tech Stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Backend  | Python Flask, eBay Browse API, OAuth 2.0   |
| Frontend | React 19, Vite, Tailwind CSS 4, PWA        |
| Deploy   | GitHub Pages (frontend), self-hosted (API)  |

## Setup

### Backend

```bash
pip install -r snout/requirements.txt
cp snout/.env.example snout/.env
# Edit .env with your eBay developer credentials
python -m snout.app
```

Run from the repository root — `snout/app.py` uses relative imports, so
invoking it directly (`python snout/app.py`) fails with `ImportError:
attempted relative import with no known parent package`.

Environment variables:
- `EBAY_APP_ID` — eBay application ID (required)
- `EBAY_CERT_ID` — eBay certificate ID (required for Browse API)
- `DEFAULT_MARKETPLACE` — eBay marketplace ID (default: `EBAY_GB`)
- `SNOUT_API_KEY` — if set, search endpoints require a matching `X-Snout-Key`
  header; the frontend sends it from `VITE_SNOUT_API_KEY`

### Frontend

```bash
cd web
npm install
npm run dev
```

The dev server proxies `/api` requests to `http://localhost:5000`. To bypass the
proxy and call the API directly, set `VITE_API_URL` in `web/.env.local`.

Frontend environment variables (`web/.env.local`):
- `VITE_API_URL` — Flask API base URL; leave unset to use the dev proxy
- `VITE_SNOUT_API_KEY` — must match the backend's `SNOUT_API_KEY`, or search
  requests come back `401 Unauthorized`

### Build

```bash
cd web
npm run build
# Output in web/dist/ with service worker + manifest
```

## API Endpoints

| Endpoint         | Method | Description                              |
| ---------------- | ------ | ---------------------------------------- |
| `/api/search`    | GET    | Search active listings (Browse API)      |
| `/search/sold`   | GET    | [Legacy] Search sold listings            |
| `/search/active` | GET    | [Legacy] Search active listings          |
| `/search/compare`| GET    | [Legacy] Compare sold vs active          |
| `/health`        | GET    | Health check                             |
| `/config/status` | GET    | Credential configuration status          |

### `/api/search` query parameters

- `q` — search keywords (required)
- `condition` — `new`, `open_box`, `refurbished`, `used`, `for_parts`
- `min_price` / `max_price` — price range filter
- `sort` — `best_match`, `price_asc`, `price_desc`, `date_asc`, `date_desc`
- `listing_type` — `buy_it_now`, `auction`
- `uk_only` — `true` to restrict to UK sellers
- `limit` — results per page (default 50, max 200)
- `offset` — pagination offset

## Deployment

Frontend deploys automatically to GitHub Pages on push to `master` (changes in `web/`).

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full roadmap.

- [x] Sticky filters + listing type + UK only
- [x] Built-in search presets (Competition, Auctions, New Items)
- [ ] Sales tracking UI + manual entry
- [ ] eBay OAuth (Fulfillment API for order history, Finances API for fees)
