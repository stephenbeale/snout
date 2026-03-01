const EBAY_FEE_RATE = 0.128; // 12.8%
const EBAY_FEE_FIXED = 0.3; // 30p per order
const DEFAULT_POSTAGE = 2.8; // GBP

/**
 * Calculate eBay UK fees for a given sale price.
 */
export function calculateFees(salePrice) {
  return round(salePrice * EBAY_FEE_RATE + EBAY_FEE_FIXED);
}

/**
 * Calculate profit after fees and postage.
 */
export function calculateProfit(
  salePrice,
  costPrice,
  postageCost = DEFAULT_POSTAGE
) {
  const fees = calculateFees(salePrice);
  return round(salePrice - costPrice - fees - postageCost);
}

function round(n) {
  return Math.round(n * 100) / 100;
}
