import { formatGBP, formatDate } from "../utils/formatters";

/**
 * What the user actually realised on this item, shown next to what the market
 * is currently asking. Replaces the old sold-listings panel — eBay retired the
 * API that supplied other sellers' sold prices.
 */
export default function OwnSalesStats({ ownSales, marketMedian }) {
  if (!ownSales) return null;

  const entries = [
    { label: "Avg", value: ownSales.average },
    { label: "Median", value: ownSales.median },
    { label: "Min", value: ownSales.min },
    { label: "Max", value: ownSales.max },
  ];

  const delta =
    marketMedian != null ? marketMedian - ownSales.median : null;

  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg border border-violet-800/60 bg-violet-950/30 p-3">
      <div className="col-span-4 text-[10px] uppercase tracking-wider text-violet-400">
        Your sales
      </div>

      {entries.map((e) => (
        <div key={e.label} className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            {e.label}
          </span>
          <span className="text-sm font-semibold text-slate-200">
            {formatGBP(e.value)}
          </span>
        </div>
      ))}

      <div className="col-span-4 text-center text-[10px] text-slate-500">
        {ownSales.count} matching sale{ownSales.count !== 1 ? "s" : ""}
        {ownSales.lastDate && ` · last ${formatDate(ownSales.lastDate)}`}
        {delta != null && (
          <>
            {" · market is "}
            <span className={delta >= 0 ? "text-green-400" : "text-orange-400"}>
              {formatGBP(Math.abs(delta))} {delta >= 0 ? "above" : "below"}
            </span>
            {" your median"}
          </>
        )}
      </div>
    </div>
  );
}
