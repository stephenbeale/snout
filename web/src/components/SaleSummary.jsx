import { formatGBP } from "../utils/formatters";

export default function SaleSummary({ stats }) {
  if (!stats) return null;

  const profitColor = stats.totalProfit >= 0 ? "text-green-400" : "text-red-400";
  const marginColor = stats.avgMargin >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg border border-slate-800 bg-slate-800/50 p-3">
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Profit</span>
        <span className={`text-sm font-semibold ${profitColor}`}>
          {formatGBP(stats.totalProfit)}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Revenue</span>
        <span className="text-sm font-semibold text-slate-200">
          {formatGBP(stats.totalRevenue)}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Sales</span>
        <span className="text-sm font-semibold text-slate-200">{stats.count}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Margin</span>
        <span className={`text-sm font-semibold ${marginColor}`}>
          {stats.avgMargin}%
        </span>
      </div>
    </div>
  );
}
