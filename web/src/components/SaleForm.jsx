import { useState, useEffect } from "react";

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function SaleForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [postage, setPostage] = useState("2.80");
  const [date, setDate] = useState(today());

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setCostPrice(String(initial.costPrice));
      setSalePrice(String(initial.salePrice));
      setPostage(String(initial.postage));
      setDate(initial.date);
    }
  }, [initial]);

  const parsedCost = Number(costPrice);
  const parsedSale = Number(salePrice);
  const parsedPostage = postage === "" ? 0 : Number(postage);
  const canSave =
    title.trim().length > 0 &&
    Number.isFinite(parsedCost) &&
    parsedCost >= 0 &&
    Number.isFinite(parsedSale) &&
    parsedSale >= 0 &&
    Number.isFinite(parsedPostage) &&
    parsedPostage >= 0 &&
    Boolean(date);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      costPrice: parsedCost,
      salePrice: parsedSale,
      postage: parsedPostage,
      date,
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-4">
      <input
        type="text"
        aria-label="Item title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Item title..."
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          aria-label="Cost price"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          placeholder="Cost price"
          min="0"
          step="0.01"
          className={inputClass}
        />
        <input
          type="number"
          aria-label="Sale price"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          placeholder="Sale price"
          min="0"
          step="0.01"
          className={inputClass}
        />
        <input
          type="number"
          aria-label="Postage"
          value={postage}
          onChange={(e) => setPostage(e.target.value)}
          placeholder="Postage"
          min="0"
          step="0.01"
          className={inputClass}
        />
        <input
          type="date"
          aria-label="Sale date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
        >
          {initial ? "Update" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
