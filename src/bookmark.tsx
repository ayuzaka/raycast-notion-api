import { Action, ActionPanel, getPreferenceValues, List } from "@raycast/api";
import { getFavicon, useCachedPromise } from "@raycast/utils";
import { useBookmarkList } from "./hooks/useBookmarkList";
import { useFetchBookmarks } from "./hooks/useFetchBookmarks";
import { useFetchTags } from "./hooks/useFetchTags";
import { Notion, Tag } from "./utils/Notion";

type Preference = {
  auth: string;
  tagDatabaseId: string;
  bookmarkDatabaseId: string;
};

type DropdownProps = {
  tags: readonly Tag[];
  handleChange: (newValue: string) => void;
};

const TagDropdown = ({ tags, handleChange }: DropdownProps) => {
  return (
    <List.Dropdown tooltip="Select tag" defaultValue="All" onChange={handleChange}>
      <List.Dropdown.Item title="All" value="all" />
      <List.Dropdown.Section>
        {tags.map((tag) => (
          <List.Dropdown.Item key={tag.id} title={tag.name} value={tag.id} icon={tag.icon} />
        ))}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
};

export default function Bookmark() {
  const preference = getPreferenceValues<Preference>();
  const notion = new Notion(preference.auth, preference.tagDatabaseId);

  const tags = useFetchTags(notion);

  const { data, isLoading } = useFetchBookmarks(notion, preference.bookmarkDatabaseId);
  const { filteredBookmarks, setSearchText, updateSearchTag } = useBookmarkList(data);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarAccessory={<TagDropdown tags={tags || []} handleChange={updateSearchTag} />}
    >
      {filteredBookmarks.map((bookmark) => (
        <List.Item
          key={bookmark.id}
          title={bookmark.name}
          icon={bookmark.favicon || getFavicon(bookmark.url)}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={bookmark.url} />
              <Action.CopyToClipboard content={bookmark.url} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
