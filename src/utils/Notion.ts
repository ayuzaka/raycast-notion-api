import { Client, APIResponseError } from "@notionhq/client";
import type { CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";
import type { Result } from "../types";
import { formatDate } from "./dateUtils";

export type Tag = {
  readonly id: string;
  readonly name: string;
};

type ArticleProps = {
  readonly title: string;
  readonly url: string;
  readonly ogp: string | undefined;
  readonly icon: string | undefined;
  readonly tags: string[];
  readonly published: Date | null;
};

export class Notion {
  #client: Client;
  #tagDatabaseId: string;

  constructor(auth: string, tagDatabaseId: string) {
    this.#client = new Client({ auth });
    this.#tagDatabaseId = tagDatabaseId;
  }

  async fetchTags(): Promise<readonly Tag[]> {
    console.log("fetch tags");
    const { results } = await this.#client.databases.query({
      database_id: this.#tagDatabaseId,
      sorts: [{ property: "Name", direction: "ascending" }],
    });
    if (!results[0]) {
      return [];
    }

    const tags = await Promise.all(
      results.map(async (result) => {
        const namePropertyResponse = await this.#client.pages.properties.retrieve({
          page_id: result.id,
          property_id: "title",
        });

        if (namePropertyResponse.type === "property_item") {
          const response = namePropertyResponse.results[0];
          if (response?.type === "title") {
            return { id: result.id, name: response.title.plain_text };
          }
        }

        return { id: result.id, name: "" };
      })
    );

    return tags;
  }

  async stockArticle(databaseId: string, articleProps: ArticleProps): Promise<Result<string>> {
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
}
