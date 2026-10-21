// CB-M02 guided reading between immutable self-authored fictional examples only.
import { listMockNews, resolveMockNews } from "./news-workbench.mjs";

export function listMockTopics() {
  const items = listMockNews().items;
  return Object.freeze(["security", "protocol", "education"].map(category =>
    Object.freeze({ category, count: items.filter(row => row.category === category).length,
      status: "MOCK_ONLY_NOT_PUBLISHED" })));
}

export function createMockReadingPath(slug) {
  const detail = resolveMockNews(slug);
  if (detail.status !== "MOCK_DETAIL_NOT_PUBLISHED") {
    return Object.freeze({ status: "NOT_FOUND", position: 0, total: 0,
      previous: null, next: null });
  }
  const items = listMockNews().items;
  const index = items.findIndex(row => row.slug === detail.item.slug);
  if (index < 0) throw new TypeError("Invalid offline fixture");
  const link = row => row ? Object.freeze({ slug: row.slug, title: row.title,
    status: "MOCK_ONLY_NOT_PUBLISHED" }) : null;
  return Object.freeze({ status: "MOCK_PATH_NOT_PUBLISHED", position: index + 1,
    total: items.length, previous: link(items[index - 1]), next: link(items[index + 1]) });
}
