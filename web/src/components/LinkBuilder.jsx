import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  // Film & TV
  { value: "617", label: "DVDs & Blu-rays" },
  { value: "176984", label: "Blu-ray Discs" },
  { value: "11232", label: "DVDs" },
  { value: "175672", label: "4K Ultra HD" },
  { value: "11233", label: "VHS Tapes" },
  // Music
  { value: "261186", label: "CDs & Vinyl" },
  { value: "237", label: "Music CDs" },
  { value: "176985", label: "Vinyl Records" },
  // Games & Consoles
  { value: "73160", label: "Video Games" },
  { value: "139971", label: "Video Game Consoles" },
  { value: "171833", label: "Video Game Accessories" },
  // Books & Comics
  { value: "267", label: "Books" },
  { value: "63", label: "Comics & Graphic Novels" },
  // Electronics
  { value: "293", label: "Electronics" },
  { value: "15032", label: "Cameras & Photography" },
  { value: "3270", label: "Computers & Tablets" },
  { value: "11071", label: "Mobile Phones" },
  // Collectables
  { value: "1", label: "Collectables" },
  { value: "220", label: "Toys & Games" },
];

const CONDITIONS = [
  { value: "", label: "Any Condition" },
  { value: "1000", label: "New" },
  { value: "5000|4000|2750", label: "Used" },
];

const EBAY_BASE = "https://www.ebay.co.uk/sch/i.html";

function buildEbayUrl({ keywords, category, condition, sold, minPrice, maxPrice, freePostage }) {
  const params = new URLSearchParams();
  params.set("_nkw", keywords);
  if (category) params.set("_sacat", category);
  params.set("_from", "R40");
  params.set("LH_BIN", "1");
  params.set("LH_PrefLoc", "1");
  if (condition) params.set("LH_ItemCondition", condition);
  if (sold) params.set("LH_Sold", "1");
  if (minPrice) params.set("_udlo", minPrice);
  if (maxPrice) params.set("_udhi", maxPrice);
  if (freePostage) params.set("LH_FS", "1");
  params.set("rt", "nc");
  return `${EBAY_BASE}?${params.toString()}`;
}

export default function LinkBuilder() {
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useLocalStorage("snout-link-category", "617");
  const [condition, setCondition] = useLocalStorage("snout-link-condition", "");
  const [sold, setSold] = useLocalStorage("snout-link-sold", false);
  const [minPrice, setMinPrice] = useLocalStorage("snout-link-min-price", "");
  const [maxPrice, setMaxPrice] = useLocalStorage("snout-link-max-price", "");
  const [freePostage, setFreePostage] = useLocalStorage("snout-link-free-postage", false);
  const [history, setHistory] = useLocalStorage("snout-link-history", []);

  const canGenerate = keywords.trim().length > 0;

  const url = canGenerate
    ? buildEbayUrl({ keywords: keywords.trim(), category, condition, sold, minPrice, maxPrice, freePostage })
    : "";

  const handleOpen = () => {
    if (!canGenerate) return;
    // Add to history (max 20, no duplicates by keyword)
    const entry = {
      keywords: keywords.trim(),
      category,
      condition,
      sold,
      minPrice,
      maxPrice,
      freePostage,
      url,
      ts: Date.now(),
    };
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => h.keywords.toLowerCase() !== entry.keywords.toLowerCase()
      );
      return [entry, ...filtered].slice(0, 20);
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    if (!canGenerate) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback: select a temporary input
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  const handleHistoryClick = (entry) => {
    setKeywords(entry.keywords);
    setCategory(entry.category);
    setCondition(entry.condition);
    setSold(entry.sold);
    setMinPrice(entry.minPrice || "");
    setMaxPrice(entry.maxPrice || "");
    setFreePostage(entry.freePostage || false);
  };

  const clearHistory = () => setHistory([]);

  const conditionLabel = CONDITIONS.find((c) => c.value === condition)?.label || "Any";
  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || "All";

  return (
    <div className="flex flex-col gap-4">
      {/* Keywords */}
      <div>
        <label htmlFor="link-keywords" className="mb-1 block text-xs font-medium text-slate-400">
          Keywords
        </label>
        <input
          id="link-keywords"
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleOpen()}
          placeholder="e.g. cyrano de bergerac dvd depardieu"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
          autoComplete="off"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="link-category" className="mb-1 block text-xs font-medium text-slate-400">
          Category
        </label>
        <select
          id="link-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Condition pills */}
      <div>
        <span className="mb-1 block text-xs font-medium text-slate-400">Condition</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Item condition">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCondition(c.value)}
              role="radio"
              aria-checked={condition === c.value}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                condition === c.value
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles row: Sold + Free P&P */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSold(!sold)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            sold
              ? "bg-violet-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
          aria-pressed={sold}
        >
          Sold Prices
        </button>
        <button
          onClick={() => setFreePostage(!freePostage)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            freePostage
              ? "bg-sky-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
          aria-pressed={freePostage}
        >
          Free P&P
        </button>
      </div>

      {/* Price range */}
      <div>
        <span className="mb-1 block text-xs font-medium text-slate-400">Price range</span>
        <div className="flex gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            min="0"
            step="0.01"
            aria-label="Minimum price"
            className="w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
          />
          <span className="flex items-center text-xs text-slate-600">to</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            min="0"
            step="0.01"
            aria-label="Maximum price"
            className="w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Preset badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-emerald-900/50 px-2.5 py-0.5 text-xs text-emerald-400">
          UK Only
        </span>
        <span className="rounded-full bg-emerald-900/50 px-2.5 py-0.5 text-xs text-emerald-400">
          Buy It Now
        </span>
        {category && (
          <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
            {categoryLabel}
          </span>
        )}
        {condition && (
          <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
            {conditionLabel}
          </span>
        )}
        {sold && (
          <span className="rounded-full bg-violet-900/50 px-2.5 py-0.5 text-xs text-violet-300">
            Sold
          </span>
        )}
        {freePostage && (
          <span className="rounded-full bg-sky-900/50 px-2.5 py-0.5 text-xs text-sky-300">
            Free P&P
          </span>
        )}
        {(minPrice || maxPrice) && (
          <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
            {minPrice && maxPrice
              ? `£${minPrice}–£${maxPrice}`
              : minPrice
                ? `£${minPrice}+`
                : `Up to £${maxPrice}`}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleOpen}
          disabled={!canGenerate}
          className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Open on eBay
        </button>
        <button
          onClick={handleCopy}
          disabled={!canGenerate}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Copy link to clipboard"
        >
          Copy
        </button>
      </div>

      {/* Generated URL preview */}
      {canGenerate && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <p className="break-all text-xs text-slate-500">{url}</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Recent</span>
            <button
              onClick={clearHistory}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {history.map((entry) => (
              <li key={entry.ts}>
                <button
                  onClick={() => handleHistoryClick(entry)}
                  className="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800"
                >
                  <span className="font-medium">{entry.keywords}</span>
                  <span className="ml-2 text-slate-500">
                    {CATEGORIES.find((c) => c.value === entry.category)?.label || "All"}
                    {entry.sold ? " · Sold" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
