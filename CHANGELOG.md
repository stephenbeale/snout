# Changelog

## 2.0.0 — 2026-03-01

### Added
- eBay Browse API integration (`/api/search` endpoint) replacing decommissioned Finding API
- OAuth client_credentials token manager with auto-refresh
- React PWA frontend with Vite + Tailwind CSS 4
  - Search with condition pills, price range, sort
  - Item cards showing price + shipping breakdown
  - Price stats banner (avg, median, min, max)
  - Saved filter presets (localStorage)
  - Bottom tab navigation (Search, Filters, Sales placeholder)
  - Dark theme, mobile-first responsive design
  - PWA manifest + service worker (installable)
- CORS support (`flask-cors`)
- GitHub Pages deployment workflow for frontend
- UK eBay fee calculator utility (12.8% + 30p)

### Changed
- Legacy Finding API endpoints (`/search/sold`, `/search/active`, `/search/compare`) retained but marked as legacy
- API version bumped to 2.0.0
- `.env.example` updated — removed manual OAUTH_TOKEN, added DEFAULT_MARKETPLACE

## 1.0.0 — 2026-01-10

### Added
- Initial Flask API with eBay Finding API
- Search sold and active listings
- Price comparison endpoint
- Rate limiting
- Input validation
