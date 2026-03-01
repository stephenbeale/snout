const API_URL = import.meta.env.VITE_API_URL || "";

export async function searchItems(keywords, filters = {}, offset = 0) {
  const params = new URLSearchParams({ q: keywords });

  if (filters.condition) params.set("condition", filters.condition);
  if (filters.minPrice) params.set("min_price", filters.minPrice);
  if (filters.maxPrice) params.set("max_price", filters.maxPrice);
  if (filters.sort) params.set("sort", filters.sort);
  if (offset > 0) params.set("offset", String(offset));

  const response = await fetch(`${API_URL}/api/search?${params}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Search failed (${response.status})`);
  }

  return response.json();
}
