import ItemCard from "./ItemCard";

export default function SearchResults({ items, loading, pagination, onLoadMore }) {
  if (!items.length && !loading) return null;

  const hasMore = pagination && pagination.returned >= pagination.limit;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        {pagination
          ? `Showing ${pagination.offset + items.length} results`
          : `${items.length} results`}
      </p>

      {items.map((item) => (
        <ItemCard key={item.item_id} item={item} />
      ))}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="rounded-lg border border-slate-700 py-2.5 text-sm text-slate-400 transition-colors hover:border-amber-500 hover:text-amber-400 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
