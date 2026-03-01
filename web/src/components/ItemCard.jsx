import { formatGBP } from "../utils/formatters";

export default function ItemCard({ item }) {
  const hasShipping = item.shipping_cost > 0;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-lg border border-slate-800 bg-slate-800/50 p-3 transition-colors hover:border-slate-700"
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

        {/* Condition badge */}
        <span className="self-start rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          {item.condition}
        </span>
      </div>
    </a>
  );
}
