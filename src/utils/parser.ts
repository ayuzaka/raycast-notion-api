import { parseDocument } from "htmlparser2";
import { getElementsByTagName, textContent, getAttributeValue, hasAttrib, findOne } from "domutils";
import type { Document, Element } from "domhandler";
import { getIcon } from "./icon";

type ParsedDOM = {
  title: string;
  ogp: string | undefined;
  icon: string | undefined;
};

const getTitle = (document: Document): string => {
  return textContent(getElementsByTagName("title", document));
};

const isOGP = (elem: Element): boolean => {
  return getAttributeValue(elem, "property") === "og:image" && hasAttrib(elem, "content");
};

const getOGP = (document: Document): string | undefined => {
  const metaElements = getElementsByTagName("meta", document);
  const ogp = findOne(isOGP, metaElements);
  if (ogp) {
    return getAttributeValue(ogp, "content");
  }

  return;
};

export const parseDOM = (html: string, origin: string): ParsedDOM => {
  const document = parseDocument(html);
  const title = getTitle(document);
  const ogp = getOGP(document);
  const icon = getIcon(document, origin);

  return { title, ogp, icon };
};
