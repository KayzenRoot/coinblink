// M10 P0 newsletter exercise. Never registers recipients, collects consent or sends mail.
import { listMockNews } from "../CB-M02/news-workbench.mjs";

export const NEWSLETTER_DEMO_POLICY = "P0_LOCAL_NEVER_SENT_NO_SUBSCRIBERS";
const TOPICS = Object.freeze(["all", "security", "protocol", "education"]);
const invalid = Object.freeze({ status: "INVALID_TOPIC", preview: null });
const safeSlug = /^demo-[a-z0-9-]{1,42}$/u;

export function listMockNewsletterTopics() {
  return TOPICS;
}

export function buildMockNewsletterPreview(topic = "all") {
  if (typeof topic !== "string" || !TOPICS.includes(topic)) return invalid;
  const found = listMockNews({ category: topic });
  if (found.status !== "MOCK_RESULTS" || !found.items.length || found.items.length > 3
      || !found.items.every(row => row.demo === true && row.published === false
        && row.rights === "SYNTHETIC_NOT_LICENSED_NEWS" && safeSlug.test(row.slug))) return invalid;
  const stories = Object.freeze(found.items.map(row => Object.freeze({
    slug: row.slug, category: row.category, title: row.title,
    summary: row.summary, path: "/en/news/" + row.slug,
  })));
  const preview = Object.freeze({
    title: "CoinBlink fictional learning digest",
    topic, stories, storyCount: stories.length, recipients: 0,
    sent: false, scheduled: false, published: false, consentCollected: false,
    verified: false, deliveryEnabled: false, requiresHumanRightsReview: true,
  });
  return Object.freeze({ status: "LOCAL_PREVIEW_NOT_SENT", preview });
}
