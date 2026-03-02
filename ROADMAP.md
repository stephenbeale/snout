# Snout Roadmap

## Completed

- [x] **Sticky filters** — all filter settings persist in localStorage across searches and sessions
- [x] **Listing type filter** — Buy It Now / Auction filter
- [x] **UK Only toggle** — restrict results to UK sellers
- [x] **Clear All + filter summary** — active filter tags with one-click reset

## Planned

- [x] **Default search presets** — built-in quick modes (Competition, Auctions, New Items) + custom user presets with save/load
  - "Sold Prices" mode blocked — Browse API can't search completed listings
- [ ] **Phase 2: Sales tracking** — manual entry UI, profit calculations, sales history
- [ ] **Phase 3: eBay OAuth** — Fulfillment API for order history, Finances API for actual fee data

## Blocked

- [ ] **Sold item search** — Browse API cannot search completed/sold listings. The legacy Finding API supported this but has been decommissioned. Requires future eBay API support or alternative data source.
