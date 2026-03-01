import { useLocalStorage } from "./useLocalStorage";

export function useSavedFilters() {
  const [saved, setSaved] = useLocalStorage("snout-saved-filters", []);

  const save = (name, keywords, filters) => {
    setSaved((prev) => {
      const filtered = prev.filter((p) => p.name !== name);
      return [...filtered, { name, keywords, filters }];
    });
  };

  const remove = (name) => {
    setSaved((prev) => prev.filter((p) => p.name !== name));
  };

  const load = (preset) => ({
    keywords: preset.keywords,
    filters: preset.filters,
  });

  return { saved, save, remove, load };
}
