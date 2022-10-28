import { Cache } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import type { Bookmark, Notion } from "../utils/Notion";

const CACHE_KEY = "bookmarks";
export const useFetchBookmarks = (notion: Notion, databaseId: string) => {
  const cache = new Cache();

  const response = useCachedPromise(async () => {
    if (cache.has(CACHE_KEY)) {
      const cached = cache.get(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as readonly Bookmark[];
      }
    }

    const bookmarks = await notion.fetchBookmarks(databaseId);

    cache.set(CACHE_KEY, JSON.stringify(bookmarks));

    return bookmarks;
  });

  return response;
};
