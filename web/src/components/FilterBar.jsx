import { CONDITIONS, SORT_OPTIONS } from "../utils/constants";

export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3">
      {/* Condition pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => update("condition", null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !filters.condition
              ? "bg-amber-500 text-slate-900"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          Any
        </button>
        {CONDITIONS.map((c) => (
          <button
            key={c.value}
            onClick={() =>
              update("condition", filters.condition === c.value ? null : c.value)
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filters.condition === c.value
                ? "bg-amber-500 text-slate-900"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Price range + sort */}
      <div className="flex gap-2">
        <input
          type="number"
          value={filters.minPrice}
          onChange={(e) => update("minPrice", e.target.value)}
          placeholder="Min price"
          min="0"
          step="0.01"
          className="w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
        />
        <input
          type="number"
          value={filters.maxPrice}
          onChange={(e) => update("maxPrice", e.target.value)}
          placeholder="Max price"
          min="0"
          step="0.01"
          className="w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
        />
        <select
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value)}
          className="w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
