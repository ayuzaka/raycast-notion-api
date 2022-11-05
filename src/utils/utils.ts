const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^=!:${}()|[]\/\\]/g, "\\$&");
};

export const filterName = (searchText: string, target: string): boolean => {
  return new RegExp(escapeRegExp(searchText), "gi").test(target);
};

export const filterTag = (searchTag: string, targets: string[]): boolean => {
  return targets.includes(searchTag);
};
