const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const DISALLOWED_ELEMENTS = /<(?:script|foreignObject|image|feImage|iframe|object|embed|audio|video)\b/i;
const EVENT_ATTRIBUTE = /\bon[a-z][a-z0-9_-]*\s*=/i;
const EXTERNAL_REFERENCE = /(?:https?:|\/\/|data:|blob:|javascript:|file:)/i;
const BOM_AND_SPACE = /^\uFEFF?\s*/i;
const XML_DECLARATION = /^<\?xml\s[^>]*\?>\s*/i;
const NAMESPACE_ATTRIBUTE = new RegExp(String.raw`\bxmlns\s*=\s*['"]` + SVG_NAMESPACE + String.raw`['"]`);
const NAMESPACE_ATTRIBUTE_GLOBAL = new RegExp(NAMESPACE_ATTRIBUTE.source, "g");
const ID_ATTRIBUTE = /\bid\s*=\s*['"]([^'"]+)['"]/g;
const FUNCTIONAL_URL = /\burl\s*\(\s*([^)]*)\)/gi;
const LOCAL_FRAGMENT = /^['"]?#/;

function hasNonLocalUrlReference(content) {
  for (const reference of content.matchAll(FUNCTIONAL_URL)) {
    if (!LOCAL_FRAGMENT.test(reference[1].trim())) return true;
  }
  return false;
}

export function inspectSvg(source) {
  const errors = [];
  const content = source.replace(BOM_AND_SPACE, "").replace(XML_DECLARATION, "");

  if (!/^\s*<svg\b/i.test(content)) errors.push("root element is not svg");
  if (!/<\/svg>\s*$/i.test(content)) errors.push("svg root is not closed");
  if (!NAMESPACE_ATTRIBUTE.test(content)) {
    errors.push("standard SVG namespace is missing");
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(content)) errors.push("DTD or entity declaration is forbidden");
  if (DISALLOWED_ELEMENTS.test(content)) errors.push("active or embedded content is forbidden");
  if (EVENT_ATTRIBUTE.test(content)) errors.push("event handler attributes are forbidden");
  if (/@import\b|@font-face\b/i.test(content)) errors.push("external CSS import or font is forbidden");

  const withoutStandardNamespace = content.replace(NAMESPACE_ATTRIBUTE_GLOBAL, "");
  if (EXTERNAL_REFERENCE.test(withoutStandardNamespace)) {
    errors.push("external or executable URL is forbidden");
  }
  if (/\b(?:href|src)\s*=/i.test(content)) errors.push("link attributes are forbidden");
  if (hasNonLocalUrlReference(content)) {
    errors.push("only local fragment URL references are allowed");
  }

  const ids = new Set([...content.matchAll(ID_ATTRIBUTE)].map((match) => match[1]));
  const duplicateIds = [...content.matchAll(ID_ATTRIBUTE)]
    .map((match) => match[1])
    .filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicateIds.length > 0) errors.push("duplicate SVG ids are forbidden");

  for (const reference of content.matchAll(/url\(\s*#([^)]+)\)/g)) {
    if (!ids.has(reference[1].trim())) errors.push("local URL reference has no matching id");
  }

  const viewBox = content.match(/\bviewBox\s*=\s*['"]([^'"]+)['"]/i)?.[1];
  if (!viewBox || !/^-?\d+(?:\.\d+)?(?:\s+-?\d+(?:\.\d+)?){3}$/.test(viewBox)) {
    errors.push("viewBox must contain four finite numeric values");
  } else if (viewBox.split(/\s+/).some((value) => !Number.isFinite(Number(value)))) {
    errors.push("viewBox contains a non-finite number");
  }

  return { errors, viewBox };
}
