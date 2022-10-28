import { Client, APIResponseError } from "@notionhq/client";
import type {
  CreatePageParameters,
  GetPagePropertyResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { Result } from "../types";
import { formatDate } from "./dateUtils";

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
      readonly value: string;
    };

export class Notion {
  #client: Client;
  #tagDatabaseId: string;

  constructor(auth: string, tagDatabaseId: string) {
    this.#client = new Client({ auth });
    this.#tagDatabaseId = tagDatabaseId;
  }

  private async fetchProperties(pageId: string, propertyIds: string[]): Promise<GetPagePropertyResponse[]> {
    return await Promise.all(
      propertyIds.map(async (propertyId) => {
        return await this.#client.pages.properties.retrieve({ page_id: pageId, property_id: propertyId });
      })
    );
  }

  async fetchTags(): Promise<readonly Tag[]> {
    const { results } = (await this.#client.databases.query({
      database_id: this.#tagDatabaseId,
      sorts: [{ property: "Name", direction: "ascending" }],
    })) as { results: PageObjectResponse[] };
    if (!results[0]) {
      return [];
    }

    const tags = await Promise.all(
      results.map(async (result) => {
        const icon = Notion.getIcon(result.icon);
        const namePropertyResponse = await this.#client.pages.properties.retrieve({
          page_id: result.id,
          property_id: "title",
        });
        const property = Notion.getProperty(namePropertyResponse);
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
  }

  async stockArticle(databaseId: string, articleProps: Article): Promise<Result<string>> {
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
      await this.#client.pages.create(parameters);

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
  }

  async fetchBookmarks(databaseId: string): Promise<readonly Bookmark[]> {
    const { results } = (await this.#client.databases.query({
      database_id: databaseId,
      sorts: [{ property: "Tag", direction: "ascending" }],
    })) as { results: PageObjectResponse[] };
    if (!results[0]) {
      return [];
    }
    const propertyIds = Object.entries(results[0].properties).map((property) => property[1].id);

    const bookmarks = await Promise.all(
      results.map(async (result) => {
        const favicon = Notion.getIcon(result.icon);
        const properties = await this.fetchProperties(result.id, propertyIds);
        const bookmark = Notion.getBookmark(result.id, properties, favicon);

        return bookmark;
      })
    );

    return bookmarks;
  }

  static getProperty(response: GetPagePropertyResponse): Property | null {
    switch (response.type) {
      case "property_item": {
        const results = response.results;
        if (results[0]?.type === "title") {
          return { name: "title", value: results[0].title.plain_text };
        }

        if (results[0]?.type === "relation") {
          return { name: "tag", value: results[0].relation.id };
        }

        return null;
      }

      case "url": {
        return { name: "url", value: response.url || "" };
      }

      default:
        return null;
    }
  }

  static getIcon(icon: PageObjectResponse["icon"]): string | null {
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
  }

  static getBookmark(id: string, responses: GetPagePropertyResponse[], favicon: string | null): Bookmark {
    const bookmark: Bookmark = {
      id,
      url: "",
      name: "",
      tag: [],
      favicon,
    };

    responses.forEach((response) => {
      const property = this.getProperty(response);
      switch (property?.name) {
        case "title":
          bookmark.name = property.value;
          break;

        case "url":
          bookmark.url = property.value;
          break;

        case "tag":
          bookmark.tag.push(property.value);
          break;

        default:
          break;
      }
    });

    return bookmark;
  }
}
