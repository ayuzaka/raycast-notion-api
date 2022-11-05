import { expect, test } from "vitest";
import { validateURL } from "./validate";

test("エラーがない場合 null を返す", () => {
  expect(validateURL("https://example.com")).toBeNull();
});

test("未指定はエラー", () => {
  expect(validateURL(undefined)).toBe("URL is required");
});

test("空文字はエラー", () => {
  expect(validateURL("")).toBe("URL is required");
});

test("相対パスはエラー", () => {
  expect(validateURL("/example.com")).toBe("Invalid URL");
});
