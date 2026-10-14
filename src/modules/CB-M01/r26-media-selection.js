(() => {
  const script = document.currentScript;
  const heroPicture = script?.parentElement?.matches("picture[data-preview-region='hero']")
    ? script.parentElement
    : null;

  if (heroPicture) {
    const motionSource = heroPicture.querySelector("source[data-motion-srcset]");
    const staticSource = heroPicture.querySelector("source[data-static-srcset]");
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const limitedData = connection?.saveData === true
      || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType);
    const allowMotion = globalThis.matchMedia("(prefers-reduced-motion: no-preference)").matches && !limitedData;
    const motionSrcset = motionSource?.dataset.motionSrcset;
    const staticSrcset = staticSource?.dataset.staticSrcset;

    if (!allowMotion) motionSource?.setAttribute("media", "not all");
    if (motionSource && motionSrcset) motionSource.setAttribute("srcset", motionSrcset);
    if (staticSource && staticSrcset) staticSource.setAttribute("srcset", staticSrcset);
  }

  const sourceMatchesCurrentImage = (source, image) => source.srcset.split(",").some((candidate) => {
    const sourceUrl = candidate.trim().split(/\s+/u, 1)[0];
    return sourceUrl && new URL(sourceUrl, document.baseURI).href === image.currentSrc;
  });

  const revealImage = (image) => {
    if (!image.naturalWidth) return;
    const picture = image.closest("picture[data-preview-region]");
    const region = picture?.dataset.previewRegion;
    if (region === "hero") picture.closest(".hero-scene")?.classList.add("has-cinematic-preview");
    if (region === "promo") picture.closest(".promo-panel")?.classList.add("has-promo-master");
    if (region === "editorial") picture.closest(".news-art")?.classList.add("has-editorial-master");
  };

  const recoverImage = (image) => {
    const picture = image.closest("picture[data-preview-region]");
    if (!picture) return;
    const failedSource = Array.from(picture.querySelectorAll("source")).find((source) =>
      sourceMatchesCurrentImage(source, image),
    );
    if (!failedSource) return;
    failedSource.remove();
  };

  document.addEventListener("load", (event) => {
    if (event.target instanceof HTMLImageElement) revealImage(event.target);
  }, true);
  document.addEventListener("error", (event) => {
    if (event.target instanceof HTMLImageElement) recoverImage(event.target);
  }, true);

  const initializeLoadedImages = () => {
    document.querySelectorAll("picture[data-preview-region] img").forEach((image) => {
      if (image.complete && image.naturalWidth > 0) revealImage(image);
      else if (image.complete) recoverImage(image);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLoadedImages, { once: true });
  } else {
    initializeLoadedImages();
  }
})();
