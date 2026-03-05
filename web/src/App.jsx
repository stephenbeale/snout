import { useState } from "react";
import Layout from "./components/Layout";
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import PriceStats from "./components/PriceStats";
import SearchResults from "./components/SearchResults";
import SavedFilters from "./components/SavedFilters";
import { useSearch } from "./hooks/useSearch";
import { useSavedFilters } from "./hooks/useSavedFilters";
import { useLocalStorage } from "./hooks/useLocalStorage";
import SalesTab from "./components/SalesTab";
import { DEFAULT_FILTERS } from "./utils/constants";

export default function App() {
  const [tab, setTab] = useState("search");
  const [includeTax, setIncludeTax] = useLocalStorage("snout-include-tax", false);
  const [keywords, setKeywords] = useState("");
  const [filters, setFilters] = useLocalStorage("snout-filters", DEFAULT_FILTERS);

  const { results, stats, market, pagination, loading, error, search, loadMore } =
    useSearch();
  const { saved, save, remove, load } = useSavedFilters();

  const handleSearch = () => {
    if (!keywords.trim()) return;
    search(keywords, filters);
  };

  const handleLoadFilter = (preset) => {
    const loaded = load(preset);
    if (loaded.keywords) setKeywords(loaded.keywords);
    setFilters(loaded.filters);
    const searchKeywords = loaded.keywords || keywords;
    if (searchKeywords.trim()) search(searchKeywords, loaded.filters);
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
          <SearchResults
            items={results}
            loading={loading}
            pagination={pagination}
            market={market}
            includeTax={includeTax}
            onLoadMore={() => loadMore(keywords, filters)}
          />
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
        <SalesTab includeTax={includeTax} onToggleTax={setIncludeTax} />
      )}
    </Layout>
  );
}
