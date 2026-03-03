import { useState, useRef } from "react";
import { formatGBP } from "../utils/formatters";
import { calculateProfit, calculateFees } from "../utils/fees";

export default function ItemCard({ item }) {
  const hasShipping = item.shipping_cost > 0;
  const [showCalc, setShowCalc] = useState(false);
  const [costInput, setCostInput] = useState("");
  const inputRef = useRef(null);

  const costPrice = parseFloat(costInput) || 0;
  const profit = calculateProfit(item.total_price, costPrice);
  const fees = calculateFees(item.total_price);
  const hasResult = costInput !== "";

  function openCalc(e) {
    e.preventDefault();
    e.stopPropagation();
    setShowCalc(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeCalc(e) {
    e.preventDefault();
    e.stopPropagation();
    setShowCalc(false);
    setCostInput("");
  }

  function handleKey(e) {
    if (e.key === "Escape") closeCalc(e);
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/50 transition-colors hover:border-slate-700">
      {/* Main card — links to eBay */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 p-3"
      >
        {/* Image */}
        {item.image_url && (
          <img
            src={item.image_url}
            alt=""
            className="h-20 w-20 flex-shrink-0 rounded-md bg-slate-700 object-cover"
            loading="lazy"
          />
        )}

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight text-slate-200">
            {item.title}
          </h3>

          {/* Price breakdown */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-amber-400">
              {formatGBP(item.total_price)}
            </span>
            {hasShipping && (
              <span className="text-xs text-slate-500">
                {formatGBP(item.item_price)} + {formatGBP(item.shipping_cost)} P&P
              </span>
            )}
            {!hasShipping && (
              <span className="text-xs text-green-500">Free P&P</span>
            )}
          </div>

          {/* Condition badge + flip button */}
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              {item.condition}
            </span>
            {!showCalc && (
              <button
                onClick={openCalc}
                className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-amber-500/20 hover:text-amber-400"
              >
                Flip?
              </button>
            )}
          </div>
        </div>
      </a>

      {/* Profit calculator — outside the <a> to avoid navigation */}
      {showCalc && (
        <div
          className="flex items-center gap-2 border-t border-slate-700/60 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-slate-400">Cost</span>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-xs text-slate-400">£</span>
            <input
              ref={inputRef}
              type="number"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-24 rounded border border-slate-600 bg-slate-900 py-1 pl-5 pr-2 text-xs text-slate-100 outline-none focus:border-amber-500"
            />
          </div>

          {hasResult && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">→</span>
              <span
                className={`text-sm font-bold ${
                  profit >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {profit >= 0 ? "+" : ""}
                {formatGBP(profit)}
              </span>
              <span className="text-[10px] text-slate-500">
                after {formatGBP(fees)} fees
              </span>
            </div>
          )}

          <button
            onClick={closeCalc}
            className="ml-auto text-xs text-slate-600 transition-colors hover:text-slate-400"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
