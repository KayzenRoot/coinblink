// CB-M13-P0: empty layout-only synthetic test data.
// Not a public advertisement, inventory sale, ad server or revenue measurement.
const SLOT_DEFINITIONS = Object.freeze({
  home: Object.freeze([
    Object.freeze({id:"home-banner",label:"Homepage banner space",state:"EMPTY_PLACEHOLDER",isAdvertisement:false,creative:null}),
    Object.freeze({id:"home-content",label:"Homepage in-content space",state:"EMPTY_PLACEHOLDER",isAdvertisement:false,creative:null}),
  ]),
  article: Object.freeze([
    Object.freeze({id:"article-header",label:"Article header space",state:"EMPTY_PLACEHOLDER",isAdvertisement:false,creative:null}),
    Object.freeze({id:"article-inline",label:"Article inline space",state:"EMPTY_PLACEHOLDER",isAdvertisement:false,creative:null}),
    Object.freeze({id:"article-footer",label:"Article footer space",state:"EMPTY_PLACEHOLDER",isAdvertisement:false,creative:null}),
  ]),
  digest: Object.freeze([
    Object.freeze({id:"digest-footer",label:"Unsent digest footer space",state:"EMPTY_PLACEHOLDER",isAdvertisement:false,creative:null}),
  ]),
});
const CONTEXTS = Object.freeze([
  Object.freeze({id:"home",label:"Fictional homepage",slotCount:2}),
  Object.freeze({id:"article",label:"Fictional article",slotCount:3}),
  Object.freeze({id:"digest",label:"Unsent digest",slotCount:1}),
]);
const INVALID = Object.freeze({status:"INVALID_CONTEXT",preview:null});

export function listLocalPlacementContexts() {
  return CONTEXTS;
}

export function buildLocalPlacementPreview(context) {
  if (typeof context !== "string" || !Object.hasOwn(SLOT_DEFINITIONS,context)) {
    return INVALID;
  }
  const slots = SLOT_DEFINITIONS[context];
  return Object.freeze({
    status:"EMPTY_LAYOUT_ONLY",
    preview:Object.freeze({
      mode:"LOCAL_SYNTHETIC",
      context,
      slotCount:slots.length,
      slots,
      live:false,
      adsEnabled:false,
      sponsor:null,
      revenue:null,
      impressionsTracked:false,
      clicksTracked:false,
      bookingEnabled:false,
    }),
  });
}
