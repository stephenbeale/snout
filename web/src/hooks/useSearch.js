import { useState, useCallback } from "react";
import { searchItems, searchSoldCount } from "../utils/api";

const MOCK_ITEMS = [
  { title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones - Black", item_price: 189.99, shipping_cost: 0, total_price: 189.99, condition: "New", url: "#", image_url: "https://placehold.co/160x160/1e293b/f59e0b?text=XM5" },
  { title: "Apple AirPods Pro 2nd Gen with MagSafe USB-C Charging Case", item_price: 169.00, shipping_cost: 3.99, total_price: 172.99, condition: "New", url: "#", image_url: "https://placehold.co/160x160/1e293b/f59e0b?text=AirPods" },
  { title: "Nintendo Switch OLED Console - White - Boxed with All Accessories", item_price: 219.99, shipping_cost: 4.99, total_price: 224.98, condition: "Used", url: "#", image_url: "https://placehold.co/160x160/1e293b/f59e0b?text=Switch" },
  { title: "Dyson V15 Detect Absolute Cordless Vacuum Cleaner - Refurbished", item_price: 329.00, shipping_cost: 0, total_price: 329.00, condition: "Refurbished", url: "#", image_url: "https://placehold.co/160x160/1e293b/f59e0b?text=Dyson" },
  { title: "Samsung Galaxy S24 Ultra 256GB Titanium Black - Unlocked", item_price: 749.99, shipping_cost: 0, total_price: 749.99, condition: "Open Box", url: "#", image_url: "https://placehold.co/160x160/1e293b/f59e0b?text=S24" },
  { title: "Lego Technic Porsche 911 GT3 RS (42056) - Sealed Retired Set", item_price: 449.00, shipping_cost: 6.50, total_price: 455.50, condition: "New", url: "#", image_url: "https://placehold.co/160x160/1e293b/f59e0b?text=Lego" },
];

const MOCK_STATS = {
  count: MOCK_ITEMS.length,
  average: 237.08,
  median: 224.98,
  min: 172.99,
  max: 749.99,
};

const MOCK_MARKET = { activeCount: 47, soldCount: 83, soldAvg: 201.50 };

const USE_MOCK = true;

export function useSearch() {
  const [results, setResults] = useState(USE_MOCK ? MOCK_ITEMS : []);
  const [stats, setStats] = useState(USE_MOCK ? MOCK_STATS : null);
  const [market, setMarket] = useState(USE_MOCK ? MOCK_MARKET : null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (keywords, filters, offset = 0) => {
    if (USE_MOCK) {
      setResults(MOCK_ITEMS);
      setStats(MOCK_STATS);
      setMarket(MOCK_MARKET);
      return;
    }

    setLoading(true);
    setError(null);

    if (offset === 0) {
      setResults([]);
      setStats(null);
      setPagination(null);
      setMarket(null);
    }

    try {
      // Fire active + sold searches in parallel
      const [data, soldData] = await Promise.all([
        searchItems(keywords, filters, offset),
        offset === 0 && !filters.showSold
          ? searchSoldCount(keywords).catch(() => null)
          : Promise.resolve(null),
      ]);

      const activeCount = data.pagination?.total || data.items?.length || 0;

      setResults((prev) => (offset === 0 ? data.items : [...prev, ...data.items]));
      setStats(data.stats);
      setPagination(data.pagination);

      if (soldData) {
        setMarket({ activeCount, soldCount: soldData.soldCount, soldAvg: soldData.soldAvg });
      } else if (offset === 0) {
        setMarket({ activeCount, soldCount: null, soldAvg: null });
      }
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(
    (keywords, filters) => {
      if (!pagination) return;
      const nextOffset = pagination.offset + pagination.limit;
      search(keywords, filters, nextOffset);
    },
    [pagination, search]
  );

  return { results, stats, market, pagination, loading, error, search, loadMore };
}
