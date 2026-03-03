import { calculateFees, calculateProfit } from "../utils/fees";
import { formatGBP, formatDate } from "../utils/formatters";

export default function SaleCard({ sale, armed, onEdit, onDelete }) {
  const fees = calculateFees(sale.salePrice);
  const profit = calculateProfit(sale.salePrice, sale.costPrice, sale.postage);
  const profitColor = profit >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-800/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-slate-200">{sale.title}</h3>
          <span className="text-xs text-slate-500">{formatDate(sale.date)}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(sale)}
            className="rounded p-1 text-slate-500 hover:text-amber-400"
            aria-label="Edit sale"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(sale.id)}
            className={`rounded p-1 transition-colors ${armed ? "text-red-400 animate-pulse" : "text-slate-500 hover:text-red-400"}`}
            aria-label={armed ? "Confirm delete" : "Delete sale"}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>Cost: {formatGBP(sale.costPrice)}</span>
        <span>Sold: {formatGBP(sale.salePrice)}</span>
        <span>Fees: {formatGBP(fees)}</span>
        <span>P&P: {formatGBP(sale.postage)}</span>
      </div>

      <div className={`text-sm font-bold ${profitColor}`}>
        Profit: {formatGBP(profit)}
      </div>
    </div>
  );
}
