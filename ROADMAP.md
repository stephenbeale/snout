# Snout Roadmap

## Completed

- [x] **Sticky filters** — all filter settings persist in localStorage across searches and sessions
- [x] **Listing type filter** — Buy It Now / Auction filter
- [x] **UK Only toggle** — restrict results to UK sellers
- [x] **Clear All + filter summary** — active filter tags with one-click reset

## Planned

- [ ] **Default search presets** — quick-switch modes:
  - "Sold Prices" mode (blocked — Browse API can't search sold; needs future API support)
  - "Competition" mode — live BIN + UK Only + price+P&P sorted
  - Custom user presets with save/load
- [ ] **Phase 2: Sales tracking** — manual entry UI, profit calculations, sales history
- [ ] **Phase 3: eBay OAuth** — Fulfillment API for order history, Finances API for actual fee data

## Blocked

- [ ] **Sold item search** — Browse API cannot search completed/sold listings. The legacy Finding API supported this but has been decommissioned. Requires future eBay API support or alternative data source.
