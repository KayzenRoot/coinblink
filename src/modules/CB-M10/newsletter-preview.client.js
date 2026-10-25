  const root = document.querySelector("[data-m10-root]");
  const topic = root?.querySelector("[data-m10-topic]");
  const build = root?.querySelector("[data-m10-build]");
  const clear = root?.querySelector("[data-m10-clear]");
  const statusMessage = root?.querySelector("[data-m10-status]");
  const preview = root?.querySelector("[data-m10-preview]");
  const title = root?.querySelector("[data-m10-title]");
  const count = root?.querySelector("[data-m10-count]");
  const stories = root?.querySelector("[data-m10-stories]");
  const orderStatus = root?.querySelector("[data-m10-order-status]");
  if (topic instanceof HTMLSelectElement && build instanceof HTMLButtonElement
      && clear instanceof HTMLButtonElement && statusMessage instanceof HTMLElement
      && preview instanceof HTMLElement && title instanceof HTMLElement
      && count instanceof HTMLElement && stories instanceof HTMLElement
      && orderStatus instanceof HTMLElement) {
    const reset = () => {
      preview.hidden = true;
      stories.replaceChildren();
      title.textContent = "";
      count.textContent = "";
      orderStatus.textContent = "";
      statusMessage.textContent = "Choose a theme, then preview fictional content. No message can be sent.";
    };
    topic.addEventListener("change", reset);
    clear.addEventListener("click", () => {
      topic.value = "all";
      reset();
      topic.focus();
    });
    const refreshEdges = () => {
      const rows = [...stories.querySelectorAll("li[data-m10-story]")];
      rows.forEach((row, position) => {
        const up = row.querySelector("[data-m10-move-up]");
        const down = row.querySelector("[data-m10-move-down]");
        if (up instanceof HTMLButtonElement) up.disabled = position === 0;
        if (down instanceof HTMLButtonElement) down.disabled = position === rows.length - 1;
      });
    };
    build.addEventListener("click", () => {
      reset();
      // The server builds bounded fictional snapshots from the canonical M02/M10 model.
      // The external client uses no imports, data store, fetch, cookies or APIs.
      const encoded = topic.selectedOptions.item(0)?.dataset.m10Snapshot;
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
        statusMessage.textContent = "Invalid theme. Nothing was generated or transmitted.";
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
        li.dataset.m10Story = "";
        const controls = document.createElement("div");
        controls.className = "m10-order-controls";
        const up = document.createElement("button");
        up.type = "button";
        up.dataset.m10MoveUp = "";
        up.setAttribute("aria-label", "Move " + story.title + " up");
        up.textContent = "Move up";
        const down = document.createElement("button");
        down.type = "button";
        down.dataset.m10MoveDown = "";
        down.setAttribute("aria-label", "Move " + story.title + " down");
        down.textContent = "Move down";
        const shift = (direction) => {
          const rows = [...stories.querySelectorAll("li[data-m10-story]")];
          const index = rows.indexOf(li);
          if (index < 0 || index + direction < 0 || index + direction >= rows.length) return;
          if (direction === -1) {
            stories.insertBefore(li, rows[index - 1]);
          } else {
            stories.insertBefore(li, rows[index + 1].nextSibling);
          }
          refreshEdges();
          orderStatus.textContent = "Moved " + story.title
            + (direction < 0 ? " up" : " down")
            + " in the local preview. Nothing was saved or sent.";
          (direction < 0 ? up : down).focus();
        };
        up.addEventListener("click", () => shift(-1));
        down.addEventListener("click", () => shift(1));
        controls.append(up, down);
        li.append(link, detail, controls);
        stories.append(li);
      }
      refreshEdges();
      preview.hidden = false;
      statusMessage.textContent = "Unsent mock preview assembled locally. No delivery took place.";
      title.focus();
    });
  }
