import { findAll, getAttributeValue, getElementsByTagName } from "domutils";
import type { Element, Document } from "domhandler";

const sizesRegex = /([0-9]+)x[0-9]+/;

const getIconSize = (size: string | undefined): number => {
  if (!size) {
    return 0;
  }

  const foundSizes = size.match(sizesRegex);
  if (!foundSizes) {
    return 0;
  }

  const match = foundSizes[1];
  if (!match) {
    return 0;
  }

  const num = Number(match);
  if (Number.isNaN(num)) {
    return 0;
  }

  return num;
};

const getMaxSizeIcon = (icons: Element[]): string => {
  let maxSize = -1;
  let maxIcon = "";

  icons.forEach((icon) => {
    const sizeElement = getAttributeValue(icon, "sizes");
    const size = getIconSize(sizeElement);
    if (size > maxSize) {
      const href = getAttributeValue(icon, "href");
      if (href) {
        maxSize = size;
        maxIcon = href;
      }
    }
  });

  return maxIcon;
};

const isIcon = (elem: Element): boolean => {
  const rel = getAttributeValue(elem, "rel");

  return rel === "icon" || rel === "shortcut icon";
};

const isAppleIcon = (elem: Element): boolean => {
  const rel = getAttributeValue(elem, "rel");

  return rel === "apple-touch-icon";
};

export const getIcon = (document: Document, origin: string): string | undefined => {
  const linkElements = getElementsByTagName("link", document);

  // apple-touch-icon の方がきれいに表示できるため優先的に取得する
  const appleIcons = findAll(isAppleIcon, linkElements);
  if (appleIcons.length > 0) {
    const maxSizeIcon = getMaxSizeIcon(appleIcons);

    if (maxSizeIcon.startsWith("/")) {
      return `${origin}${maxSizeIcon}`;
    }

    return maxSizeIcon;
  }

  const icons = findAll(isIcon, linkElements);
  if (icons.length === 0) {
    return;
  }

  const maxSizeIcon = getMaxSizeIcon(icons);
  if (maxSizeIcon.startsWith("/")) {
    return `${origin}${maxSizeIcon}`;
  }

  return maxSizeIcon;
};
