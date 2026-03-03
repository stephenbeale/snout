import { useState, useRef, useEffect } from "react";
import { useSales } from "../hooks/useSales";
import SaleForm from "./SaleForm";
import SaleSummary from "./SaleSummary";
import SaleList from "./SaleList";

export default function SalesTab() {
  const { sales, stats, addSale, updateSale, removeSale } = useSales();
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

      <SaleList
        sales={sales}
        armed={armed}
        onEdit={(sale) => setEditing(sale)}
        onDelete={handleDelete}
      />
    </div>
  );
}
