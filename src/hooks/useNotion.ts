import { useCallback } from "react";
import { Client, APIResponseError } from "@notionhq/client";
import type {
  CreatePageParameters,
  PageObjectResponse,
  QueryDatabaseParameters,
} from "@notionhq/client/build/src/api-endpoints";
import type { Result } from "../types";
import { formatDate } from "../utils/dateUtils";

export type Tag = {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
};

export type Bookmark = {
  id: string;
  name: string;
  url: string;
  favicon: string | null;
  cover: string | null;
  tag: string[];
};

type Article = {
  readonly title: string;
  readonly url: string;
  readonly ogp: string | undefined;
  readonly icon: string | undefined;
  readonly tags: string[];
  readonly published: Date | null;
};

export const useNotion = (auth: string, tagDatabaseId: string) => {
  const client = new Client({ auth });

  const getIcon = useCallback((icon: PageObjectResponse["icon"]): string | null => {
    if (!icon) {
      return null;
    }

    if (icon.type === "emoji") {
      return icon.emoji.toString();
    }

    if (icon.type === "external") {
      return icon.external.url;
    }

    return icon.file.url;
  }, []);

  const getCover = useCallback((cover: PageObjectResponse["cover"]): string | null => {
    if (!cover) {
      return null;
    }

    if (cover.type === "external") {
      return cover.external.url;
    }

    return cover.file.url;
  }, []);

  const getName = (properties: PageObjectResponse["properties"]): string => {
    const property = properties["Name"];
    if (property?.type === "title") {
      const name = property.title.map((t) => t.plain_text).join("");

      return name;
    }

    return "";
  };

  const getURL = (properties: PageObjectResponse["properties"]): string => {
    const property = properties["URL"];
    if (property?.type === "url" && property.url) {
      return property.url;
    }

    return "";
  };

  const getTagIds = (properties: PageObjectResponse["properties"]): string[] => {
    const property = properties["Tag"];
    if (property?.type === "relation") {
      return property.relation.map((r) => r.id);
    }

    return [];
  };

  const fetchDatabase = useCallback(
    async (id: string): Promise<PageObjectResponse[]> => {
      const allResults: PageObjectResponse[] = [];
      let next: string | null = null;

      do {
        const parameter: QueryDatabaseParameters = {
          database_id: id,
          sorts: [{ property: "Name", direction: "ascending" }],
        };

        if (next) {
          parameter.start_cursor = next;
        }

        const { results, next_cursor } = await client.databases.query(parameter);
        allResults.push(...(results as PageObjectResponse[]));
        next = next_cursor;
      } while (next);

      return allResults;
    },
    [client.databases],
  );

  const fetchTags = useCallback(async (): Promise<readonly Tag[]> => {
    const results = await fetchDatabase(tagDatabaseId);
    if (!results[0]) {
      return [];
    }

    const tags = await Promise.all(
      results.map(async (result) => {
        const icon = getIcon(result.icon);
        const namePropertyResponse = await client.pages.properties.retrieve({
          page_id: result.id,
          property_id: "title",
        });

        if (namePropertyResponse.object === "list") {
          const tagName = namePropertyResponse.results
            .map((result) => {
              if (result.type === "title") {
                return result.title.plain_text;
              }

              return "";
            })
            .join("");

          return {
            id: result.id,
            name: tagName,
            icon,
          };
        }

        return {
          id: result.id,
          name: "",
          icon,
        };
      }),
    );

    return tags;
  }, [client.pages.properties, fetchDatabase, getIcon, tagDatabaseId]);

  const stockArticle = useCallback(
    async (databaseId: string, articleProps: Article): Promise<Result<string>> => {
      const { title, url, ogp, icon, tags, published } = articleProps;

      const parameters: CreatePageParameters = {
        parent: { database_id: databaseId },
        properties: {
          Title: {
            type: "title",
            title: [{ text: { content: title.trim() } }],
          },
          URL: { type: "url", url },
        },
      };

      if (icon) {
        parameters.icon = {
          type: "external",
          external: {
            url: icon,
          },
        };
      }

      if (tags.length > 0) {
        const relations = tags.map((tag) => ({ id: tag }));
        parameters.properties["Tag"] = {
          relation: relations,
        };
      }

      if (published) {
        parameters.properties["Published"] = {
          type: "date",
          date: { start: formatDate(published) },
        };
      }

      if (ogp) {
        parameters.cover = {
          type: "external",
          external: {
            url: ogp,
          },
        };
      }

      try {
        await client.pages.create(parameters);

        return {
          type: "success",
          data: "ok",
        };
      } catch (err) {
        if (err instanceof APIResponseError) {
          return {
            type: "failure",
            err: {
              name: err.name,
              message: err.message,
            },
          };
        }

        return {
          type: "failure",
          err: {
            name: "create page error",
            message: "failed to stock article",
          },
        };
      }
    },
    [client.pages],
  );

  const fetchBookmarks = useCallback(
    async (databaseId: string): Promise<readonly Bookmark[]> => {
      const results = await fetchDatabase(databaseId);
      if (!results[0]) {
        return [];
      }

      const bookmarks = await Promise.all(
        results.map(async (result) => {
          const favicon = getIcon(result.icon);
          const cover = getCover(result.cover);

          const name = getName(result.properties);
          const url = getURL(result.properties);
          const tagIds = getTagIds(result.properties);

          const bookmark = { id: result.id, name, url, tag: tagIds, favicon, cover };

          return bookmark;
        }),
      );

      return bookmarks;
    },
    [fetchDatabase, getIcon, getCover],
  );

  return { fetchTags, fetchBookmarks, stockArticle };
};
