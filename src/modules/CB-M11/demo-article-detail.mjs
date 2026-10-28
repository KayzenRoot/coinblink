// CB-M11-P1-ARTICLE-DETAIL-001: one canonical invented article per slug.
// Same strict projection as the list, so the detail can never widen a field the
// list would refuse. The article body is deliberately not exposed: the sandbox
// is not licensed for redistributing full text.
import { listMockNews, resolveMockNews } from "../CB-M02/news-workbench.mjs";
import { projectDemoArticle } from "./demo-articles.mjs";

const empty = (status) => Object.freeze({
  status, mode: "SYNTHETIC", live: false, redistributable: false, item: null,
});

/** @param {unknown} slug */
export function buildDemoArticleDetail(slug) {
  const resolved = resolveMockNews(slug);
  if (resolved.status === "BAD_REQUEST") return empty("BAD_REQUEST");
  if (resolved.status !== "MOCK_DETAIL_NOT_PUBLISHED" || resolved.item === null) return empty("NOT_FOUND");
  const canonical = listMockNews().items.find((item) => item.slug === resolved.item.slug);
  if (canonical === undefined) return empty("UNAVAILABLE");
  const item = projectDemoArticle(resolved.item, canonical);
  if (item === null) return empty("UNAVAILABLE");
  return Object.freeze({
    status: "DEMO_DETAIL_NOT_PUBLISHED",
    mode: "SYNTHETIC", live: false, redistributable: false, item,
  });
}
