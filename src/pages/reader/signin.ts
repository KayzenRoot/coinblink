// CB-M16-P1-READERS-001: sign-in page.
import type { APIRoute } from "astro";
import { signInPage } from "../../modules/CB-M16/readers.mjs";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const sent = url.searchParams.get("sent") === "1";
  const error = url.searchParams.get("error");
  const message = sent ? "" : error === "link" ? "That link is no longer valid. Request a new one." : "";
  return signInPage({ message, deleted: url.searchParams.get("deleted") === "1" });
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "GET" } });
