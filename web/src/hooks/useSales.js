import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { calculateProfit, applyTax } from "../utils/fees";

export function useSales(includeTax = false) {
  const [sales, setSales] = useLocalStorage("snout-sales", []);

  const sorted = useMemo(
    () => [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [sales]
  );

  const addSale = (sale) => {
    setSales((prev) => [...prev, { ...sale, id: crypto.randomUUID() }]);
  };

  const updateSale = (id, updates) => {
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeSale = (id) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  const stats = useMemo(() => {
    if (sorted.length === 0) return null;
    let totalProfit = 0;
    let totalRevenue = 0;
    for (const s of sorted) {
      const rawProfit = calculateProfit(s.salePrice, s.costPrice, s.postage);
      totalProfit += includeTax ? applyTax(rawProfit) : rawProfit;
      totalRevenue += s.salePrice;
    }
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    return {
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      count: sorted.length,
      avgMargin: Math.round(avgMargin * 10) / 10,
    };
  }, [sorted, includeTax]);

  return { sales: sorted, stats, addSale, updateSale, removeSale };
}
