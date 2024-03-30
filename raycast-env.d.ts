/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Notion Integration Token - Notion Integration Token */
  "auth": string,
  /** Notion Article database id - Notion Article database id */
  "articleDatabaseId": string,
  /** Notion Bookmark database id - Notion Bookmark database id */
  "bookmarkDatabaseId": string,
  /** Notion Tag database id - Notion Tag database id */
  "tagDatabaseId": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `bookmark` command */
  export type Bookmark = ExtensionPreferences & {}
  /** Preferences accessible in the `clip` command */
  export type Clip = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `bookmark` command */
  export type Bookmark = {}
  /** Arguments passed to the `clip` command */
  export type Clip = {}
}

