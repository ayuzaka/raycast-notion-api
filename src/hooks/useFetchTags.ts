import { Cache } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import type { Tag } from "../hooks/useNotion";

const CACHE_KEY = "tags";
export const useFetchTags = (fetchTags: () => Promise<readonly Tag[]>) => {
  const cache = new Cache();

  const { data } = useCachedPromise(async () => {
    if (cache.has(CACHE_KEY)) {
      const cached = cache.get(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as readonly Tag[];
      }
    }

    const tags = await fetchTags();

    cache.set(CACHE_KEY, JSON.stringify(tags));

    return tags;
  });

  return data;
};
