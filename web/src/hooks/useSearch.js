import { useState, useCallback } from "react";
import { searchItems } from "../utils/api";

export function useSearch() {
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (keywords, filters, offset = 0) => {
    setLoading(true);
    setError(null);

    if (offset === 0) {
      setResults([]);
      setStats(null);
      setPagination(null);
    }

    try {
      const data = await searchItems(keywords, filters, offset);
      setResults((prev) => (offset === 0 ? data.items : [...prev, ...data.items]));
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(
    (keywords, filters) => {
      if (!pagination) return;
      const nextOffset = pagination.offset + pagination.limit;
      search(keywords, filters, nextOffset);
    },
    [pagination, search]
  );

  return { results, stats, pagination, loading, error, search, loadMore };
}
