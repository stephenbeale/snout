import SaleCard from "./SaleCard";

export default function SaleList({ sales, armed, onEdit, onDelete, includeTax }) {
  if (sales.length === 0) {
    return (
      <p className="text-center text-sm text-slate-600">
        No sales recorded yet. Tap + to add your first sale.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sales.map((sale) => (
        <SaleCard
          key={sale.id}
          sale={sale}
          armed={armed === sale.id}
          onEdit={onEdit}
          onDelete={onDelete}
          includeTax={includeTax}
        />
      ))}
    </div>
  );
}
