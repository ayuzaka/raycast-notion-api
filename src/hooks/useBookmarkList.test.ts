import { expect, test } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBookmarkList } from "./useBookmarkList";
const bookmarks = [
  {
    id: "727c3fc5-eb5a-41e2-bfab-ed0676f21af0",
    name: "HTML Living Standard",
    url: "https://html.spec.whatwg.org",
    favicon: null,
    cover: null,
    tag: ["HTML"],
  },
  {
    id: "94280b12-f83a-483c-a1c4-5af04c3273a7",
    name: "MDN Web Docs",
    url: "https://developer.mozilla.org/en-US/",
    favicon: null,
    cover: null,
    tag: ["HTML", "CSS", "JavaScript"],
  },
  {
    id: "96a88ca8-7881-400c-89ed-6d9c620291c6",
    name: "Standard Blog",
    url: "https://standard.example",
    favicon: null,
    cover: null,
    tag: ["web"],
  },
];

test("filtered by text", () => {
  const { result } = renderHook(() => useBookmarkList(bookmarks));
  act(() => {
    result.current.setSearchText("standard");
  });
  expect(result.current.filteredBookmarks).toEqual([
    {
      id: "727c3fc5-eb5a-41e2-bfab-ed0676f21af0",
      name: "HTML Living Standard",
      url: "https://html.spec.whatwg.org",
      favicon: null,
      cover: null,
      tag: ["HTML"],
    },
    {
      id: "96a88ca8-7881-400c-89ed-6d9c620291c6",
      name: "Standard Blog",
      url: "https://standard.example",
      favicon: null,
      cover: null,
      tag: ["web"],
    },
  ]);
});

test("filtered by tag", () => {
  const { result } = renderHook(() => useBookmarkList(bookmarks));
  act(() => {
    result.current.updateSearchTag("HTML");
  });
  expect(result.current.filteredBookmarks).toEqual([
    {
      id: "727c3fc5-eb5a-41e2-bfab-ed0676f21af0",
      name: "HTML Living Standard",
      url: "https://html.spec.whatwg.org",
      favicon: null,
      cover: null,
      tag: ["HTML"],
    },
    {
      id: "94280b12-f83a-483c-a1c4-5af04c3273a7",
      name: "MDN Web Docs",
      url: "https://developer.mozilla.org/en-US/",
      favicon: null,
      cover: null,
      tag: ["HTML", "CSS", "JavaScript"],
    },
  ]);
});

test("filtered by text and tag", () => {
  const { result } = renderHook(() => useBookmarkList(bookmarks));
  act(() => {
    result.current.setSearchText("standard");
    result.current.updateSearchTag("web");
  });
  expect(result.current.filteredBookmarks).toEqual([
    {
      id: "96a88ca8-7881-400c-89ed-6d9c620291c6",
      name: "Standard Blog",
      url: "https://standard.example",
      favicon: null,
      cover: null,
      tag: ["web"],
    },
  ]);
});
