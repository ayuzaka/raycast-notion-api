import { useCallback, useMemo, useState } from "react";

import { filterName, filterTag } from "../utils/utils";
import type { Bookmark } from "./useNotion";

export function useBookmarkList(data: readonly Bookmark[] | undefined) {
  const [searchText, setSearchText] = useState("");
  const [searchTag, setSearchTag] = useState<string | null>(null);

  const filteredBookmarks = useMemo(() => {
    if (!data) {
      return [];
    }

    if (!searchText && !searchTag) {
      return data;
    }

    if (!searchTag) {
      return data.filter((datum) => filterName(searchText, datum.name));
    }

    if (searchText === "") {
      return data.filter((datum) => filterTag(searchTag, datum.tag));
    }

    return data.filter((datum) => filterName(searchText, datum.name) && filterTag(searchTag, datum.tag));
  }, [data, searchText, searchTag]);

  const updateSearchTag = useCallback((tag: string) => {
    const value = tag === "all" ? null : tag;
    setSearchTag(value);
  }, []);

  return { filteredBookmarks, setSearchText, updateSearchTag };
}
