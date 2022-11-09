import { useCallback } from "react";
import { Client, APIResponseError } from "@notionhq/client";
import type {
  CreatePageParameters,
  GetPagePropertyResponse,
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

type Property =
  | {
      readonly name: "title";
      readonly value: string;
    }
  | {
      readonly name: "url";
      readonly value: string;
    }
  | {
      readonly name: "tag";
      readonly value: string[];
    };

export const useNotion = (auth: string, tagDatabaseId: string) => {
  const client = new Client({ auth });

  const fetchProperties = useCallback(
    async (pageId: string, propertyIds: string[]): Promise<GetPagePropertyResponse[]> => {
      return await Promise.all(
        propertyIds.map(
          async (propertyId) => await client.pages.properties.retrieve({ page_id: pageId, property_id: propertyId })
        )
      );
    },
    [client.pages.properties]
  );

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

  const getProperty = useCallback((response: GetPagePropertyResponse): Property | null => {
    switch (response.type) {
      case "property_item": {
        const results = response.results;
        if (results[0]?.type === "title") {
          return { name: "title", value: results[0].title.plain_text };
        }

        if (results[0]?.type === "relation") {
          const tagIds = results.map((result) => (result.type === "relation" ? result.relation.id : ""));

          return { name: "tag", value: tagIds };
        }

        return null;
      }

      case "url": {
        return { name: "url", value: response.url || "" };
      }

      default:
        return null;
    }
  }, []);

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
    [client.databases]
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
        const property = getProperty(namePropertyResponse);
        if (property?.name === "title") {
          return {
            id: result.id,
            name: property.value,
            icon,
          };
        }

        return {
          id: result.id,
          name: "",
          icon,
        };
      })
    );

    return tags;
  }, [client.pages.properties, fetchDatabase, getIcon, getProperty, tagDatabaseId]);

  const getBookmark = useCallback(
    (id: string, responses: GetPagePropertyResponse[], favicon: string | null, cover: string | null): Bookmark => {
      const bookmark: Bookmark = {
        id,
        url: "",
        name: "",
        tag: [],
        favicon,
        cover,
      };

      responses.forEach((response) => {
        const property = getProperty(response);
        switch (property?.name) {
          case "title":
            bookmark.name = property.value;
            break;

          case "url":
            bookmark.url = property.value;
            break;

          case "tag":
            bookmark.tag = property.value;
            break;

          default:
            break;
        }
      });

      return bookmark;
    },
    [getProperty]
  );

  const stockArticle = useCallback(
    async (databaseId: string, articleProps: Article): Promise<Result<string>> => {
      const { title, url, ogp, icon, tags, published } = articleProps;

      const parameters: CreatePageParameters = {
        parent: { database_id: databaseId },
        properties: {
          Title: {
            type: "title",
            title: [{ text: { content: title } }],
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
    [client.pages]
  );

  const fetchBookmarks = useCallback(
    async (databaseId: string): Promise<readonly Bookmark[]> => {
      const results = await fetchDatabase(databaseId);
      if (!results[0]) {
        return [];
      }
      const propertyIds = Object.entries(results[0].properties).map((property) => property[1].id);

      const bookmarks = await Promise.all(
        results.map(async (result) => {
          const favicon = getIcon(result.icon);
          const cover = getCover(result.cover);
          const properties = await fetchProperties(result.id, propertyIds);
          const bookmark = getBookmark(result.id, properties, favicon, cover);

          return bookmark;
        })
      );

      return bookmarks;
    },
    [fetchDatabase, fetchProperties, getBookmark, getIcon, getCover]
  );

  return { fetchTags, fetchBookmarks, stockArticle };
};
