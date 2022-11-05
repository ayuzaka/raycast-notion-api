import { parseDocument } from "htmlparser2";
import { expect, test } from "vitest";
import { getIcon } from "./icon";

const origin = "https://example.com";

const html1 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta property="og:image" content="https:///example.com/assets/social.png" />
    <link rel="apple-touch-icon" href="https://example.com/apple-logo.png" type="image/svg+xml" />
    <link rel="icon" href="https://example.com/logo.svg" type="image/svg+xml" />
    <title>test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`;

const html2 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta property="og:image" content="https:///example.com/assets/social.png" />
    <link rel="apple-touch-icon" sizes="32x32" href="https://example.com/favicon/apple-touch-icon-32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="https://example.com/favicon/apple-touch-icon-180.png">
    <link rel="icon" href="https://example.com/logo.svg" type="image/svg+xml" />
    <title>test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`;

const html3 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta property="og:image" content="https:///example.com/assets/social.png" />
    <link rel="apple-touch-icon" sizes="32x32" href="/favicon/apple-touch-icon-32.png">
    <link rel="apple-touch-icon" sizes="16x16" href="/favicon/apple-touch-icon-16.png">
    <link rel="icon" href="favicon/logo.svg" type="image/svg+xml" />
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
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
    <title>test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`;

const html5 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta property="og:image" content="https:///example.com/assets/social.png" />
    <title>test</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`;

test("apple-touch-icon が優先される", () => {
  expect(getIcon(parseDocument(html1), origin)).toBe("https://example.com/apple-logo.png");
});

test("一番大きいアイコンが優先される", () => {
  expect(getIcon(parseDocument(html2), origin)).toBe("https://example.com/favicon/apple-touch-icon-180.png");
});

test("相対パスの場合、origin が補完される", () => {
  expect(getIcon(parseDocument(html3), origin)).toBe("https://example.com/favicon/apple-touch-icon-32.png");
});

test("apple-touch-icon がない場合 icon を取得する", () => {
  expect(getIcon(parseDocument(html4), origin)).toBe("https://example.com/favicon/favicon-32x32.png");
});

test("画像がない場合 undefined", () => {
  expect(getIcon(parseDocument(html5), origin)).toBeUndefined();
});
