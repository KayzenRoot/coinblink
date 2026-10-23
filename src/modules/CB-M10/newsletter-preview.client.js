  import { buildMockNewsletterPreview } from "./newsletter-preview.mjs";
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
      const result = buildMockNewsletterPreview(topic.value);
      if (!result.preview) {
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
