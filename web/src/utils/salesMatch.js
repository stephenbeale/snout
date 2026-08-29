/**
 * Match recorded sales against search keywords.
 *
 * eBay retired the Finding API (findCompletedItems) in Feb 2025, and its
 * replacement — the Marketplace Insights API — is a Limited Release that is
 * closed to new applicants. There is no supported way to read other sellers'
 * sold prices, so the sold-price reference comes from the user's own recorded
 * sales instead.
 */

const NOISE = new Set(["the", "a", "an", "and", "of", "for", "with", "new"]);

/**
 * Split a string into comparable lowercase tokens, dropping punctuation and
 * common filler words. "Black Panther: Blu-Ray (2018)" -> [black, panther, blu, ray, 2018]
 */
export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !NOISE.has(t));
}

/**
 * Sales whose title contains every keyword token. Narrow by design — a loose
 * match would quote an unrelated item's price as a selling benchmark.
 */
export function matchSales(sales, keywords) {
  const wanted = tokenize(keywords);
  if (wanted.length === 0) return [];

  return sales.filter((sale) => {
    const titleTokens = tokenize(sale.title);
    return wanted.every((w) => titleTokens.some((t) => t.includes(w)));
  });
}

/**
 * Summarise matched sales into a price reference. Returns null when there is
 * nothing to report, so callers can skip rendering entirely.
 */
export function summariseSales(matched) {
  if (!matched || matched.length === 0) return null;

  const prices = matched.map((s) => s.salePrice).sort((a, b) => a - b);
  const total = prices.reduce((sum, p) => sum + p, 0);
  const mid = Math.floor(prices.length / 2);

  return {
    count: prices.length,
    average: round(total / prices.length),
    median:
      prices.length % 2 === 0
        ? round((prices[mid - 1] + prices[mid]) / 2)
        : prices[mid],
    min: prices[0],
    max: prices[prices.length - 1],
    lastDate: matched
      .map((s) => s.date)
      .sort()
      .at(-1),
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}
