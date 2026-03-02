import { useLocalStorage } from "./useLocalStorage";
import { DEFAULT_FILTERS } from "../utils/constants";

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
    filters: { ...DEFAULT_FILTERS, ...preset.filters },
  });

  return { saved, save, remove, load };
}
