const API_URL = import.meta.env.VITE_API_URL || "";

export async function searchSoldCount(keywords) {
  const params = new URLSearchParams({ q: keywords });
  const response = await fetch(`${API_URL}/search/sold?${params}`);
  if (!response.ok) return null;
  const data = await response.json();
  return {
    soldCount: data.stats?.count || 0,
    soldAvg: data.stats?.average || 0,
  };
}

export async function searchItems(keywords, filters = {}, offset = 0) {
  const params = new URLSearchParams({ q: keywords });

  if (filters.condition) params.set("condition", filters.condition);
  if (filters.minPrice) params.set("min_price", filters.minPrice);
  if (filters.maxPrice) params.set("max_price", filters.maxPrice);
  if (filters.sort) params.set("sort", filters.sort);
  // Sold items: route to legacy Finding API endpoint.
  // listing_type, uk_only and offset are not supported by the legacy endpoint.
  if (filters.showSold) {
    const response = await fetch(`${API_URL}/search/sold?${params}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status >= 500) {
        throw new Error("Sold items search is currently unavailable — the legacy API may be offline.");
      }
      throw new Error(body.error || `Sold search failed (${response.status})`);
    }
    return response.json();
  }

  // Active listings: Browse API supports all filters.
  if (filters.listingType) params.set("listing_type", filters.listingType);
  if (filters.ukOnly) params.set("uk_only", "true");
  if (offset > 0) params.set("offset", String(offset));

  const response = await fetch(`${API_URL}/api/search?${params}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Search failed (${response.status})`);
  }

  return response.json();
}
