import { useState, useEffect } from "react";

const today = () => new Date().toISOString().split("T")[0];

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

  const canSave = title.trim() && costPrice && salePrice;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      costPrice: parseFloat(costPrice),
      salePrice: parseFloat(salePrice),
      postage: parseFloat(postage) || 0,
      date,
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Item title..."
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          placeholder="Cost price"
          min="0"
          step="0.01"
          className={inputClass}
        />
        <input
          type="number"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          placeholder="Sale price"
          min="0"
          step="0.01"
          className={inputClass}
        />
        <input
          type="number"
          value={postage}
          onChange={(e) => setPostage(e.target.value)}
          placeholder="Postage"
          min="0"
          step="0.01"
          className={inputClass}
        />
        <input
          type="date"
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
