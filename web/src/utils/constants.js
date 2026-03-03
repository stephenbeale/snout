export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "open_box", label: "Open Box" },
  { value: "refurbished", label: "Refurbished" },
  { value: "used", label: "Used" },
  { value: "for_parts", label: "For Parts" },
];

export const SORT_OPTIONS = [
  { value: "best_match", label: "Best Match" },
  { value: "price_asc", label: "Price: Low" },
  { value: "price_desc", label: "Price: High" },
  { value: "date_asc", label: "Ending Soon" },
  { value: "date_desc", label: "Newest" },
];

export const LISTING_TYPES = [
  { value: "buy_it_now", label: "Buy It Now" },
  { value: "auction", label: "Auction" },
];

export const DEFAULT_FILTERS = {
  condition: null,
  minPrice: "",
  maxPrice: "",
  sort: "best_match",
  listingType: null,
  ukOnly: false,
  showSold: false,
};

export const BUILT_IN_PRESETS = [
  {
    name: "Competition",
    description: "UK Buy It Now, cheapest first",
    filters: { ...DEFAULT_FILTERS, listingType: "buy_it_now", ukOnly: true, sort: "price_asc" },
  },
  {
    name: "Auctions",
    description: "Ending soonest auctions",
    filters: { ...DEFAULT_FILTERS, listingType: "auction", sort: "date_asc" },
  },
  {
    name: "New Items",
    description: "Newest listed, new condition",
    filters: { ...DEFAULT_FILTERS, condition: "new", sort: "date_desc" },
  },
];
