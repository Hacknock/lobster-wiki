import { describe, expect, test, vi } from "vitest";
import { deferred, lobsterStubUrl, sidebar, siteOrigin, startWiki } from "./support/wiki-harness";

const files = {
  "nav.md": sidebar({ Introduction: "?page=intro", Guide: "?page=guide" }),
  "content/intro.md": '<h1 class="lbs-heading-1">Introduction</h1><a id="to-guide" href="?page=guide#setup">Setup</a>',
  "content/guide.md": '<h1 class="lbs-heading-1">Guide</h1><h2 id="setup" class="lbs-heading-2">Setup</h2>',
};

const heading = (wiki: Awaited<ReturnType<typeof startWiki>>) =>
  wiki.main().querySelector(".lbs-heading-1")?.textContent;

describe("initial page", () => {
  test("loads the default page when no page is requested", async () => {
    const wiki = await startWiki({ files });
    await wiki.started;
    expect(heading(wiki)).toBe("Introduction");
  });

  test("loads the configured default page", async () => {
    const wiki = await startWiki({ files, config: { defaultPage: "guide" } });
    await wiki.started;
    expect(heading(wiki)).toBe("Guide");
  });

  test("loads the requested page from the contentDir", async () => {
    const wiki = await startWiki({
      files: { ...files, "pages/guide.md": "<p>Guide in pages</p>" },
      search: "?page=guide",
      config: { contentDir: "./pages/" },
    });
    await wiki.started;
    expect(wiki.main().textContent).toBe("Guide in pages");
  });

  test("joins comma-separated pages in order", async () => {
    const wiki = await startWiki({ files, search: "?page=guide,intro" });
    await wiki.started;
    expect(Array.from(wiki.main().querySelectorAll(".lbs-heading-1"), (element) => element.textContent)).toEqual(["Guide", "Introduction"]);
  });

  test("loads the config from a JSON file", async () => {
    const wiki = await startWiki({
      files: {
        ...files,
        "wiki.config.json": JSON.stringify({ navigation: "./nav.md", title: "Site", lobsterUrl: lobsterStubUrl }),
      },
      config: "./wiki.config.json",
    });
    await wiki.started;
    expect(wiki.document.title).toBe("Introduction - Site");
  });
});

describe("link clicks", () => {
  test("switches pages without reloading", async () => {
    const wiki = await startWiki({ files });
    await wiki.started;
    expect(wiki.click('.lbw-sidebar a[href="?page=guide"]')).toBe(true);
    await vi.waitFor(() => expect(heading(wiki)).toBe("Guide"));
    expect(wiki.url()).toBe("?page=guide");
  });

  test("keeps the fragment and scrolls to its target", async () => {
    const wiki = await startWiki({ files });
    await wiki.started;
    expect(wiki.click("#to-guide")).toBe(true);
    await vi.waitFor(() => expect(heading(wiki)).toBe("Guide"));
    expect(wiki.url()).toBe("?page=guide#setup");
    expect(wiki.lastScrolledElement()).toBe(wiki.document.getElementById("setup"));
  });

  test.each([
    ["another origin", "https://other.example/docs/index.html?page=guide", {}],
    ["another path", `${siteOrigin}/other/?page=guide`, {}],
    ["a target", "?page=guide", { target: "_blank" }],
    ["a download attribute", "?page=guide", { download: "" }],
  ])("leaves a link with %s to the browser", async (_case, href, attributes) => {
    const wiki = await startWiki({ files });
    await wiki.started;
    const link = wiki.document.createElement("a");
    link.id = "candidate";
    link.href = href;
    for (const [name, value] of Object.entries(attributes)) link.setAttribute(name, value);
    wiki.main().appendChild(link);
    expect(wiki.click("#candidate")).toBe(false);
    expect(wiki.url()).toBe("");
  });

  test.each([
    ["ctrlKey", { ctrlKey: true }],
    ["metaKey", { metaKey: true }],
    ["altKey", { altKey: true }],
    ["shiftKey", { shiftKey: true }],
    ["a middle button", { button: 1 }],
  ])("leaves a click with %s to the browser", async (_case, clickOptions) => {
    const wiki = await startWiki({ files });
    await wiki.started;
    expect(wiki.click('.lbw-sidebar a[href="?page=guide"]', clickOptions)).toBe(false);
    expect(wiki.url()).toBe("");
  });

  test("leaves a link with a page parameter only in its fragment to the browser", async () => {
    const wiki = await startWiki({
      files: { ...files, "content/intro.md": '<a id="note-link" href="#note?page=guide">Note</a>' },
      search: "?page=intro",
    });
    await wiki.started;
    const requestCount = wiki.requests.length;
    expect(wiki.click("#note-link")).toBe(false);
    expect(wiki.url()).toBe("?page=intro");
    expect(wiki.requests.length).toBe(requestCount);
  });
});

describe("history", () => {
  test("goes back and forward between pages", async () => {
    const wiki = await startWiki({ files });
    await wiki.started;
    wiki.click('.lbw-sidebar a[href="?page=guide"]');
    await vi.waitFor(() => expect(heading(wiki)).toBe("Guide"));
    wiki.window.history.back();
    await vi.waitFor(() => expect(heading(wiki)).toBe("Introduction"));
    wiki.window.history.forward();
    await vi.waitFor(() => expect(heading(wiki)).toBe("Guide"));
  });

  test("does not reload the page when only the fragment changes", async () => {
    const wiki = await startWiki({ files, search: "?page=guide" });
    await wiki.started;
    const requestCount = wiki.requests.length;
    wiki.window.history.pushState(null, "", "?page=guide#setup");
    wiki.window.dispatchEvent(new wiki.window.PopStateEvent("popstate"));
    expect(wiki.requests.length).toBe(requestCount);
  });
});

describe("fragments on load", () => {
  test("scrolls to the fragment target", async () => {
    const wiki = await startWiki({ files, search: "?page=guide#setup" });
    await wiki.started;
    expect(wiki.lastScrolledElement()).toBe(wiki.document.getElementById("setup"));
    expect(wiki.scrollTo).not.toHaveBeenCalled();
  });

  test("finds a percent-encoded fragment", async () => {
    const wiki = await startWiki({
      files: { ...files, "content/guide.md": '<h2 id="設定" class="lbs-heading-2">設定</h2>' },
      search: `?page=guide#${encodeURIComponent("設定")}`,
    });
    await wiki.started;
    expect(wiki.lastScrolledElement()).toBe(wiki.document.getElementById("設定"));
  });

  test.each([
    ["no fragment", "?page=guide"],
    ["an unknown fragment", "?page=guide#unknown"],
    ["a malformed fragment", "?page=guide#%E0%A4%A"],
  ])("scrolls to the top with %s", async (_case, search) => {
    const wiki = await startWiki({ files, search });
    await wiki.started;
    expect(wiki.scrollTo).toHaveBeenLastCalledWith(0, 0);
    expect(wiki.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("overlapping navigations", () => {
  test.each([
    ["succeeds", "<h1 class=\"lbs-heading-1\">Slow</h1>"],
    ["fails", null],
  ])("keeps the newer page when an older load %s later", async (_case, slowBody) => {
    const slowPage = deferred<string | null>();
    const wiki = await startWiki({
      expectConsoleErrors: slowBody === null,
      files: {
        ...files,
        "nav.md": sidebar({ Introduction: "?page=intro", Guide: "?page=guide", Slow: "?page=slow" }),
        "content/slow.md": () => slowPage.promise,
      },
    });
    await wiki.started;
    wiki.click('.lbw-sidebar a[href="?page=slow"]');
    wiki.click('.lbw-sidebar a[href="?page=guide"]');
    await vi.waitFor(() => expect(heading(wiki)).toBe("Guide"));
    slowPage.resolve(slowBody);
    await wiki.pageLoadSettled("./content/slow.md");
    expect(heading(wiki)).toBe("Guide");
    expect(wiki.main().querySelector(".lbw-not-found")).toBeNull();
    expect(wiki.activeLabels()).toEqual(["Guide"]);
    expect(wiki.url()).toBe("?page=guide");
  });
});

describe("header and footer", () => {
  test("are rendered into their own regions", async () => {
    const wiki = await startWiki({
      files: { ...files, "header.md": "<p>Header text</p>", "footer.md": "<p>Footer text</p>" },
      config: { header: "./header.md", footer: "./footer.md" },
    });
    await wiki.started;
    expect(wiki.document.querySelector(".lbw-header > .lbw-header-inner")?.textContent).toBe("Header text");
    expect(wiki.document.querySelector(".lbw-footer")?.textContent).toBe("Footer text");
    expect(heading(wiki)).toBe("Introduction");
  });
});

describe("config file", () => {
  test("rejects when the config file is missing", async () => {
    const wiki = await startWiki({ files, config: "./wiki.config.json" });
    await expect(wiki.started).rejects.toThrow("Failed to load wiki config from ./wiki.config.json: 404 Not Found");
  });
});
