import { CONDITIONS, SORT_OPTIONS, LISTING_TYPES, DEFAULT_FILTERS } from "../utils/constants";

export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.condition !== null ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.sort !== "best_match" ||
    filters.listingType !== null ||
    filters.ukOnly === true ||
    filters.showSold === true;

  const clearAll = () => onChange({ ...DEFAULT_FILTERS });

  const activeLabels = [];
  if (filters.condition) {
    const c = CONDITIONS.find((x) => x.value === filters.condition);
    activeLabels.push(c ? c.label : filters.condition);
  }
  if (filters.listingType) {
    const lt = LISTING_TYPES.find((x) => x.value === filters.listingType);
    activeLabels.push(lt ? lt.label : filters.listingType);
  }
  if (filters.ukOnly) activeLabels.push("UK Only");
  if (filters.showSold) activeLabels.push("Sold Items");
  if (filters.minPrice) activeLabels.push(`Min £${filters.minPrice}`);
  if (filters.maxPrice) activeLabels.push(`Max £${filters.maxPrice}`);
  if (filters.sort && filters.sort !== "best_match") {
    const s = SORT_OPTIONS.find((x) => x.value === filters.sort);
    activeLabels.push(s ? s.label : filters.sort);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Condition pills */}
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

      {/* Row 2: Listing type pills + UK Only toggle */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => update("listingType", null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !filters.listingType
              ? "bg-amber-500 text-slate-900"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          Any Type
        </button>
        {LISTING_TYPES.map((lt) => (
          <button
            key={lt.value}
            onClick={() =>
              update("listingType", filters.listingType === lt.value ? null : lt.value)
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filters.listingType === lt.value
                ? "bg-amber-500 text-slate-900"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {lt.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => update("showSold", !filters.showSold)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filters.showSold
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Search completed/sold listings via legacy API — may be unavailable"
          >
            Sold Items
          </button>
          <button
            onClick={() => update("ukOnly", !filters.ukOnly)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filters.ukOnly
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            UK Only
          </button>
        </div>
      </div>

      {/* Sold items notice */}
      {filters.showSold && (
        <p className="text-xs text-violet-400/80">
          Showing sold listings — listing type and UK Only filters do not apply. Results may be limited.
        </p>
      )}

      {/* Row 3: Price range + sort */}
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

      {/* Row 4: Active filter summary + Clear All */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeLabels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300"
            >
              {label}
            </span>
          ))}
          <button
            onClick={clearAll}
            className="ml-auto rounded-full bg-red-900/60 px-3 py-0.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-900"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
