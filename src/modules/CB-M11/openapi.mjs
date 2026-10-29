// CB-M11-P1-OPENAPI-001: machine-readable contract for the public metadata API.
//
// The document describes the three real endpoints and their content-free
// payloads. It is static, frozen and safe to serve with a long browser cache.
const JSON_CONTENT = "application/json";
const ERROR_REF = "#/components/schemas/Error";

function deepFreeze(value) {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function jsonResponse(description, schemaRef) {
  return {
    description,
    content: { [JSON_CONTENT]: { schema: { $ref: schemaRef } } },
  };
}

function operation(summary, description, successRef) {
  return {
    summary,
    description,
    security: [],
    responses: {
      "200": jsonResponse("Successful response.", successRef),
      "304": { description: "Not modified; the client validator still matches." },
      "400": jsonResponse("Unsupported query parameter.", ERROR_REF),
      "405": { description: "Method not allowed; only GET, HEAD and OPTIONS are supported." },
      "503": jsonResponse("Internal failure.", ERROR_REF),
    },
  };
}

export function buildOpenApiDocument() {
  return deepFreeze({
    openapi: "3.1.0",
    info: {
      title: "CoinBlink public metadata API",
      version: "1.0.0",
      description: "Content-free collection status, coverage counts and publisher metadata. No article text, headline or excerpt is exposed.",
    },
    servers: [{ url: "/" }],
    paths: {
      "/v1/news/status": {
        get: operation(
          "Collection status",
          "Reports feed health, counts and collection time. Supports If-None-Match validation.",
          "#/components/schemas/NewsStatus",
        ),
      },
      "/v1/news/coverage": {
        get: operation(
          "Coverage counts",
          "Counts the stories carried by more than one publisher and the stories per publisher. Aggregates only.",
          "#/components/schemas/CoverageStatus",
        ),
      },
      "/v1/sources": {
        get: operation(
          "Publisher catalog",
          "Lists the reviewed publishers with home, feed and localized reader pages. Metadata only.",
          "#/components/schemas/SourceCatalog",
        ),
      },
    },
    components: {
      schemas: {
        FeedStatus: {
          type: "object",
          additionalProperties: false,
          required: ["id", "status", "itemCount", "reason"],
          properties: {
            id: { type: "string" },
            status: { type: "string", enum: ["OK", "UNAVAILABLE"] },
            itemCount: { type: "integer", minimum: 0 },
            reason: { type: ["string", "null"] },
          },
        },
        NewsStatus: {
          type: "object",
          required: ["status", "mode", "windowSeconds", "stale", "feedsTotal", "feedsRead", "items",
            "rights", "feeds", "disclaimer"],
          properties: {
            status: { type: "string", enum: ["ok", "disabled", "unavailable"] },
            mode: { const: "LIVE_THIRD_PARTY" },
            collectedAt: { type: "string", format: "date-time" },
            stale: { type: "boolean" },
            refreshFailedAt: { type: "string", format: "date-time" },
            windowSeconds: { type: "integer", minimum: 1 },
            feedsTotal: { type: "integer", minimum: 0 },
            feedsRead: { type: "integer", minimum: 0 },
            items: { type: "integer", minimum: 0 },
            rights: { type: "string", enum: ["HEADLINES_WITH_ATTRIBUTION_ONLY", "NO_CONTENT"] },
            attribution: {
              type: "object",
              required: ["required", "path"],
              properties: {
                required: { const: true },
                path: { type: "string" },
              },
            },
            feeds: { type: "array", items: { $ref: "#/components/schemas/FeedStatus" } },
            disclaimer: { type: "string" },
          },
        },
        Source: {
          type: "object",
          additionalProperties: false,
          required: ["id", "name", "home", "feed", "pages", "rights"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            home: { type: "string", format: "uri" },
            feed: { type: "string", format: "uri" },
            pages: {
              type: "object",
              additionalProperties: false,
              required: ["en", "pt-br", "es"],
              properties: {
                en: { type: "string" },
                "pt-br": { type: "string" },
                es: { type: "string" },
              },
            },
            rights: { const: "ATTRIBUTION_ONLY" },
          },
        },
        PublisherCoverage: {
          type: "object",
          additionalProperties: false,
          required: ["id", "stories"],
          properties: {
            id: { type: "string" },
            stories: { type: "integer", minimum: 0 },
          },
        },
        CoverageStatus: {
          type: "object",
          required: ["status", "mode", "stories", "headlines", "rights", "publishers", "disclaimer"],
          properties: {
            status: { type: "string", enum: ["ok", "disabled", "unavailable"] },
            mode: { type: "string", enum: ["LIVE_THIRD_PARTY"] },
            reason: { type: ["string", "null"] },
            collectedAt: { type: "string", format: "date-time" },
            stories: { type: "integer", minimum: 0 },
            headlines: { type: "integer", minimum: 0 },
            rights: { type: "string" },
            publishers: { type: "array", items: { $ref: "#/components/schemas/PublisherCoverage" } },
            disclaimer: { type: "string" },
          },
        },
        SourceCatalog: {
          type: "object",
          required: ["status", "mode", "count", "rights", "sources", "disclaimer"],
          properties: {
            status: { const: "ok" },
            mode: { const: "PUBLIC_METADATA" },
            count: { type: "integer", minimum: 0 },
            rights: { const: "ATTRIBUTION_ONLY" },
            sources: { type: "array", items: { $ref: "#/components/schemas/Source" } },
            disclaimer: { type: "string" },
          },
        },
        Error: {
          type: "object",
          additionalProperties: false,
          required: ["status"],
          properties: {
            status: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
    },
  });
}
