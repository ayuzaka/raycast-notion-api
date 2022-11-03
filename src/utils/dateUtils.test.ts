import { formatDate } from "./dateUtils";
import { expect, test } from "vitest";

test("formatDate", () => {
  expect(formatDate(new Date("1970/3/4"))).toBe("1970-03-04");
});
