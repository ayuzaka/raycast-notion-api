import { expect, test } from "vitest";
import { parseDOM } from "./parser";

const html1 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta property="og:image" content="https:///example.com/assets/social.png" />
    <link rel="icon" href="https://example.com/logo.svg" type="image/svg+xml" />
    <title>test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`;

const html2 = `
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta property="og:image" content="/logo.png" />
    <link rel="icon" href="https://example.com/logo.svg" type="image/svg+xml" />
    <title>test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`;

const html3 = `
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="https://example.com/logo.svg" type="image/svg+xml" />
    <meta property="og:image"  />
    <title>test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`;

const html4 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta property="og:image" content="https:///example.com/assets/social.png" />
    <link rel="icon" href="https://example.com/logo.svg" type="image/svg+xml" />
    <title>test</title>
  </head>
  <body>
    <header><title>foo</title></header>
    <h1>Hello World</h1>
  </body>
</html>
`;

test("OGPあり・絶対パス", () => {
  expect(parseDOM(html1, "https://example.com")).toEqual({
    title: "test",
    ogp: "https:///example.com/assets/social.png",
    icon: "https://example.com/logo.svg",
  });
});

test("OGPあり・相対パス", () => {
  expect(parseDOM(html2, "https://example.com")).toEqual({
    title: "test",
    ogp: "/logo.png",
    icon: "https://example.com/logo.svg",
  });
});

test("OGPなし", () => {
  expect(parseDOM(html3, "https://example.com")).toEqual({
    title: "test",
    ogp: undefined,
    icon: "https://example.com/logo.svg",
  });
});

test("複数タイトル", () => {
  expect(parseDOM(html4, "https://example.com")).toEqual({
    title: "test",
    ogp: "https:///example.com/assets/social.png",
    icon: "https://example.com/logo.svg",
  });
});
