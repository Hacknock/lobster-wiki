import { expect, test, vi } from "vitest";
import { sidebar, startWiki } from "./support/wiki-harness";

const files = {
  "nav.md": sidebar({ Introduction: "?page=intro", Missing: "?page=missing" }),
  "content/intro.md": '<h1 class="lbs-heading-1">Introduction</h1><h2 class="lbs-heading-2">Setup</h2>',
};

test("shows a message when the initial page cannot be loaded", async () => {
  const wiki = await startWiki({
    files,
    search: "?page=missing",
    config: { title: "Site", tableOfContents: true },
    expectConsoleErrors: true,
  });
  await expect(wiki.started).resolves.toBeUndefined();
  const message = wiki.main().querySelector(".lbw-not-found > p.lbs-paragraph");
  expect(message?.textContent).toBe("This page could not be loaded: missing");
  expect(wiki.main().children.length).toBe(1);
  expect(wiki.document.querySelector(".lbw-toc")?.innerHTML).toBe("");
  expect(wiki.document.title).toBe("Missing - Site");
  expect(wiki.consoleError).toHaveBeenCalled();
});

test("shows a message after clicking a link to a missing page", async () => {
  const wiki = await startWiki({ files, config: { tableOfContents: true }, expectConsoleErrors: true });
  await wiki.started;
  wiki.click('.lbw-sidebar a[href="?page=missing"]');
  await vi.waitFor(() => expect(wiki.main().querySelector(".lbw-not-found")).not.toBeNull());
  expect(wiki.url()).toBe("?page=missing");
  expect(wiki.activeLabels()).toEqual(["Missing"]);
  expect(wiki.document.querySelectorAll(".lbw-toc-item").length).toBe(0);
});

test("shows the page name as text", async () => {
  const pageName = '<img src="x" onerror="alert(1)">';
  const wiki = await startWiki({ files, search: `?page=${encodeURIComponent(pageName)}`, expectConsoleErrors: true });
  await wiki.started;
  expect(wiki.main().querySelector("img")).toBeNull();
  expect(wiki.main().textContent).toBe(`This page could not be loaded: ${pageName}`);
});

test("shows a message when one of several pages cannot be loaded", async () => {
  const wiki = await startWiki({ files, search: "?page=intro,missing", expectConsoleErrors: true });
  await wiki.started;
  expect(wiki.main().textContent).toBe("This page could not be loaded: intro,missing");
});

test.each([
  ["navigation", {}],
  ["header", { header: "./header.md" }],
  ["footer", { footer: "./footer.md" }],
])("rejects when the %s file is missing", async (name, config) => {
  const wiki = await startWiki({
    files: name === "navigation" ? { "content/intro.md": "<p>Intro</p>" } : files,
    config,
  });
  await expect(wiki.started).rejects.toThrow("Failed to fetch");
});
