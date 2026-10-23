  const root = document.querySelector("[data-m10-root]");
  const topic = root?.querySelector("[data-m10-topic]");
  const build = root?.querySelector("[data-m10-build]");
  const clear = root?.querySelector("[data-m10-clear]");
  const status = root?.querySelector("[data-m10-status]");
  const preview = root?.querySelector("[data-m10-preview]");
  const title = root?.querySelector("[data-m10-title]");
  const count = root?.querySelector("[data-m10-count]");
  const stories = root?.querySelector("[data-m10-stories]");
  if (topic instanceof HTMLSelectElement && build instanceof HTMLButtonElement
      && clear instanceof HTMLButtonElement && status instanceof HTMLElement
      && preview instanceof HTMLElement && title instanceof HTMLElement
      && count instanceof HTMLElement && stories instanceof HTMLElement) {
    const reset = () => {
      preview.hidden = true;
      stories.replaceChildren();
      title.textContent = "";
      count.textContent = "";
      status.textContent = "Choose a theme, then preview fictional content. No message can be sent.";
    };
    topic.addEventListener("change", reset);
    clear.addEventListener("click", () => {
      topic.value = "all";
      reset();
      topic.focus();
    });
    build.addEventListener("click", () => {
      reset();
      // The server builds bounded fictional snapshots from the canonical M02/M10 model.
      // The external client uses no imports, data store, fetch, cookies or APIs.
      const encoded = topic.selectedOptions.item(0)?.getAttribute("data-m10-snapshot");
      let result;
      try {
        result = JSON.parse(encoded || "null");
      } catch {
        result = null;
      }
      const incoming = result?.preview;
      const valid = result?.status === "LOCAL_PREVIEW_NOT_SENT"
        && incoming?.topic === topic.value && incoming?.sent === false
        && incoming?.published === false && incoming?.recipients === 0
        && incoming?.deliveryEnabled === false && Array.isArray(incoming?.stories)
        && incoming.stories.length > 0 && incoming.stories.length <= 3
        && incoming.storyCount === incoming.stories.length
        && incoming.stories.every(story => typeof story.title === "string"
          && typeof story.summary === "string" && typeof story.path === "string"
          && story.path.startsWith("/en/news/")
          && /^demo-[a-z0-9-]{1,42}$/u.test(story.path.slice("/en/news/".length)));
      if (!valid) {
        status.textContent = "Invalid theme. Nothing was generated or transmitted.";
        return;
      }
      title.textContent = result.preview.title;
      count.textContent = String(result.preview.storyCount)
        + " invented examples · 0 subscribers · 0 emails sent";
      for (const story of result.preview.stories) {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = story.path;
        link.textContent = story.title;
        const detail = document.createElement("p");
        detail.textContent = story.summary;
        li.append(link, detail);
        stories.append(li);
      }
      preview.hidden = false;
      status.textContent = "Unsent mock preview assembled locally. No delivery took place.";
      title.focus();
    });
  }
