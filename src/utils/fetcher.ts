import fetch from "isomorphic-fetch";
import type { Result } from "../types";

export const fetchHTML = async (url: string): Promise<Result<string>> => {
  try {
    const res = await fetch(url);
    const html = await res.text();

    return {
      type: "success",
      data: html,
    };
  } catch (err) {
    if (err instanceof TypeError) {
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
        name: "fetch error",
        message: "unexpected error has occurred.",
      },
    };
  }
};
