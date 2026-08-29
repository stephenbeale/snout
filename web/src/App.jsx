import { useState, useMemo } from "react";
import Layout from "./components/Layout";
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import PriceStats from "./components/PriceStats";
import OwnSalesStats from "./components/OwnSalesStats";
import SearchResults from "./components/SearchResults";
import SavedFilters from "./components/SavedFilters";
import { useSearch } from "./hooks/useSearch";
import { useSavedFilters } from "./hooks/useSavedFilters";
import { useSales } from "./hooks/useSales";
import { useLocalStorage } from "./hooks/useLocalStorage";
import SalesTab from "./components/SalesTab";
import LinkBuilder from "./components/LinkBuilder";
import { DEFAULT_FILTERS } from "./utils/constants";
import { matchSales, summariseSales } from "./utils/salesMatch";

export default function App() {
  const [tab, setTab] = useState("search");
  const [includeTax, setIncludeTax] = useLocalStorage("snout-include-tax", false);
  const [keywords, setKeywords] = useState("");
  // Keywords behind the current results — the input can drift while browsing.
  const [searchedKeywords, setSearchedKeywords] = useState("");
  const [filters, setFilters] = useLocalStorage("snout-filters", DEFAULT_FILTERS);

  const { results, stats, market, pagination, loading, error, search, loadMore } =
    useSearch();
  const { saved, save, remove, load } = useSavedFilters();
  const salesApi = useSales(includeTax);

  const ownSales = useMemo(
    () => summariseSales(matchSales(salesApi.sales, searchedKeywords)),
    [salesApi.sales, searchedKeywords]
  );

  const handleSearch = () => {
    if (!keywords.trim()) return;
    setSearchedKeywords(keywords);
    search(keywords, filters);
  };

  const handleLoadFilter = (preset) => {
    const loaded = load(preset);
    if (loaded.keywords) setKeywords(loaded.keywords);
    setFilters(loaded.filters);
    const searchKeywords = loaded.keywords || keywords;
    if (searchKeywords.trim()) {
      setSearchedKeywords(searchKeywords);
      search(searchKeywords, loaded.filters);
    }
    setTab("search");
  };

  return (
    <Layout tab={tab} onTabChange={setTab}>
      {tab === "search" && (
        <div className="flex flex-col gap-4 p-4 pb-20">
          <SearchBar
            value={keywords}
            onChange={setKeywords}
            onSearch={handleSearch}
            loading={loading}
          />
          <FilterBar filters={filters} onChange={setFilters} />
          {error && (
            <div className="rounded-lg bg-red-900/40 border border-red-700 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {stats && <PriceStats stats={stats} />}
          {stats && (
            <OwnSalesStats ownSales={ownSales} marketMedian={stats.median} />
          )}
          <SearchResults
            items={results}
            loading={loading}
            pagination={pagination}
            market={market}
            ownSales={ownSales}
            includeTax={includeTax}
            onLoadMore={() => loadMore(searchedKeywords, filters)}
          />
        </div>
      )}
      {tab === "links" && (
        <div className="flex flex-col gap-4 p-4 pb-20">
          <LinkBuilder />
        </div>
      )}
      {tab === "filters" && (
        <div className="flex flex-col gap-4 p-4 pb-20">
          <SavedFilters
            saved={saved}
            currentKeywords={keywords}
            currentFilters={filters}
            onSave={save}
            onLoad={handleLoadFilter}
            onRemove={remove}
          />
        </div>
      )}
      {tab === "sales" && (
        <SalesTab
          sales={salesApi.sales}
          stats={salesApi.stats}
          addSale={salesApi.addSale}
          updateSale={salesApi.updateSale}
          removeSale={salesApi.removeSale}
          includeTax={includeTax}
          onToggleTax={setIncludeTax}
        />
      )}
    </Layout>
  );
}
