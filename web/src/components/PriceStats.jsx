import { formatGBP } from "../utils/formatters";

export default function PriceStats({ stats }) {
  if (!stats) return null;

  const entries = [
    { label: "Avg", value: stats.average },
    { label: "Median", value: stats.median },
    { label: "Min", value: stats.min },
    { label: "Max", value: stats.max },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg border border-slate-800 bg-slate-800/50 p-3">
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
      <div className="col-span-4 text-center text-[10px] text-slate-600">
        Based on {stats.count} listing{stats.count !== 1 ? "s" : ""} (total
        price incl. P&P)
      </div>
    </div>
  );
}
