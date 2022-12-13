import { useRef } from "react";
import { Action, ActionPanel, Form, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { useFetchTags } from "./hooks/useFetchTags";
import { fetchHTML } from "./utils/fetcher";
import { parseDOM } from "./utils/parser";
import { validateURL } from "./utils/validate";
import { useNotion } from "./hooks/useNotion";

type Preference = {
  auth: string;
  tagDatabaseId: string;
  articleDatabaseId: string;
};

type FormValue = {
  url: string;
  tags: string[];
  published: Date | null;
};

export default function Clip() {
  const preference = getPreferenceValues<Preference>();
  const { fetchTags, stockArticle } = useNotion(preference.auth, preference.tagDatabaseId);

  const tags = useFetchTags(fetchTags);

  const urlFieldRef = useRef<Form.TextField>(null);
  const tagFieldRef = useRef<Form.TagPicker>(null);
  const dateFieldRef = useRef<Form.DatePicker>(null);

  const { handleSubmit, itemProps } = useForm<FormValue>({
    async onSubmit(values) {
      showToast({ title: "saving...", style: Toast.Style.Animated });

      const { url, tags, published } = values;
      const res = await fetchHTML(url);
      if (res.type === "success") {
        const { origin } = new URL(url);
        const parsedDOM = parseDOM(res.data, origin);
        const result = await stockArticle(preference.articleDatabaseId, { ...parsedDOM, url, tags, published });
        if (result.type === "success") {
          showToast({ title: "stocked article", style: Toast.Style.Success });

          urlFieldRef.current?.reset();
          tagFieldRef.current?.reset();
          dateFieldRef.current?.reset();
        } else {
          showToast({ title: result.err.name, message: result.err.message, style: Toast.Style.Failure });
        }
      } else {
        showToast({ title: res.err.name, message: res.err.message, style: Toast.Style.Failure });
      }
    },
    validation: {
      url: (value) => {
        return validateURL(value);
      },
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField title="URL" placeholder="Enter full url" ref={urlFieldRef} {...itemProps.url} />
      <Form.TagPicker title="Tag" ref={tagFieldRef} {...itemProps.tags}>
        {tags?.map((tag) => (
          <Form.TagPicker.Item key={tag.id} value={tag.id} title={tag.name} />
        ))}
      </Form.TagPicker>
      <Form.DatePicker title="published" type={Form.DatePicker.Type.Date} ref={dateFieldRef} {...itemProps.published} />
    </Form>
  );
}
