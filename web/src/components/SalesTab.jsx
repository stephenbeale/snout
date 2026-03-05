import { useState, useRef, useEffect } from "react";
import { useSales } from "../hooks/useSales";
import SaleForm from "./SaleForm";
import SaleSummary from "./SaleSummary";
import SaleList from "./SaleList";

export default function SalesTab({ includeTax, onToggleTax }) {
  const { sales, stats, addSale, updateSale, removeSale } = useSales(includeTax);
  const [editing, setEditing] = useState(null); // null | "new" | sale object
  const [armed, setArmed] = useState(null);
  const armedTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (armedTimer.current) clearTimeout(armedTimer.current);
    };
  }, []);

  const handleSave = (data) => {
    if (editing && editing !== "new") {
      updateSale(editing.id, data);
    } else {
      addSale(data);
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (armed === id) {
      removeSale(id);
      setArmed(null);
      clearTimeout(armedTimer.current);
    } else {
      setArmed(id);
      clearTimeout(armedTimer.current);
      armedTimer.current = setTimeout(() => setArmed(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {!editing && (
        <button
          onClick={() => setEditing("new")}
          className="rounded-lg border-2 border-dashed border-slate-700 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-amber-500 hover:text-amber-400"
        >
          + Add Sale
        </button>
      )}

      {editing && (
        <SaleForm
          initial={editing !== "new" ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <SaleSummary stats={stats} />

      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2">
        <span className="text-xs text-slate-400">Deduct 20% tax on profit</span>
        <button
          onClick={() => onToggleTax((v) => !v)}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            includeTax ? "bg-amber-500" : "bg-slate-600"
          }`}
          role="switch"
          aria-checked={includeTax}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              includeTax ? "translate-x-4" : ""
            }`}
          />
        </button>
      </div>

      <SaleList
        sales={sales}
        armed={armed}
        onEdit={(sale) => setEditing(sale)}
        onDelete={handleDelete}
        includeTax={includeTax}
      />
    </div>
  );
}
