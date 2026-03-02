import { useState } from "react";
import { BUILT_IN_PRESETS } from "../utils/constants";

export default function SavedFilters({
  saved,
  currentKeywords,
  currentFilters,
  onSave,
  onLoad,
  onRemove,
}) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!name.trim() || !currentKeywords.trim()) return;
    onSave(name.trim(), currentKeywords, currentFilters);
    setName("");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Modes */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-300">Quick Modes</h2>
        <ul className="flex flex-col gap-2">
          {BUILT_IN_PRESETS.map((preset) => (
            <li key={preset.name}>
              <button
                onClick={() => onLoad(preset)}
                className="flex w-full flex-col rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left transition-colors hover:bg-amber-500/20"
              >
                <span className="text-sm font-medium text-amber-400">
                  {preset.name}
                </span>
                <span className="text-xs text-slate-400">
                  {preset.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Your Presets */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-300">Your Presets</h2>

        {/* Save current */}
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Preset name..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
          />
          <button
            onClick={handleSave}
            disabled={!name.trim() || !currentKeywords.trim()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
          >
            Save
          </button>
        </div>
        {!currentKeywords.trim() && (
          <p className="text-xs text-slate-600">
            Search for something first to save a filter preset.
          </p>
        )}

        {/* List */}
        {saved.length === 0 ? (
          <p className="text-sm text-slate-600">No saved filters yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {saved.map((preset) => (
              <li
                key={preset.name}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/50 p-3"
              >
                <button
                  onClick={() => onLoad(preset)}
                  className="flex min-w-0 flex-1 flex-col text-left"
                >
                  <span className="text-sm font-medium text-slate-200">
                    {preset.name}
                  </span>
                  <span className="truncate text-xs text-slate-500">
                    {preset.keywords}
                    {preset.filters.condition && ` | ${preset.filters.condition}`}
                  </span>
                </button>
                <button
                  onClick={() => onRemove(preset.name)}
                  className="rounded p-1 text-slate-600 hover:text-red-400"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
