import { describe, expect, test } from "vitest";
import { filterName, filterTag } from "./utils";

describe("filterName", () => {
  test("指定した文字列が含まれている", () => {
    expect(filterName("Script", "ECMA Script")).toBeTruthy();
  });

  test("指定した文字列が含まれていない", () => {
    expect(filterName("Hello", "ECMA Script")).toBeFalsy();
  });

  test("大文字・小文字は区別されない", () => {
    expect(filterName("script", "ECMA Script")).toBeTruthy();
  });
});

describe("filterTag", () => {
  test("指定したタグ文字列が含まれている", () => {
    expect(filterTag("Git", ["Git", "GitHub"])).toBeTruthy();
  });

  test("大文字・小文字は区別される", () => {
    expect(filterTag("frontend", ["Frontend"])).toBeFalsy();
  });
});
