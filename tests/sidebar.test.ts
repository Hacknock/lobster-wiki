import { describe, expect, test, vi } from "vitest";
import { sidebar, siteOrigin, startWiki } from "./support/wiki-harness";

const pages = ["intro", "example", "example-table", "日本語", "part-1", "part-2", 'a"b'];
const pageFiles = Object.fromEntries(pages.map((page) => [`content/${page}.md`, `<p>${page}</p>`]));

async function openPage(search: string, links: Record<string, string>, siteTitle: string | null = "Site") {
  const wiki = await startWiki({
    files: { ...pageFiles, "nav.md": sidebar(links) },
    search,
    config: { title: siteTitle ?? undefined },
  });
  await wiki.started;
  return wiki;
}

describe("tab title", () => {
  test("joins the link label and the site title", async () => {
    const wiki = await openPage("?page=intro", { Introduction: "?page=intro" });
    expect(wiki.document.title).toBe("Introduction - Site");
  });

  test("uses the link label alone without a site title", async () => {
    const wiki = await openPage("?page=intro", { Introduction: "?page=intro" }, null);
    expect(wiki.document.title).toBe("Introduction");
  });

  test("uses the site title alone without a matching link", async () => {
    const wiki = await openPage("?page=intro", { Other: "?page=example" });
    expect(wiki.document.title).toBe("Site");
  });

  test("matches the page name exactly", async () => {
    const wiki = await openPage("?page=example", { Tables: "?page=example-table", Example: "?page=example" });
    expect(wiki.document.title).toBe("Example - Site");
  });

  test("matches percent-encoded links", async () => {
    const wiki = await openPage(`?page=${encodeURIComponent("日本語")}`, {
      日本語ページ: `?page=${encodeURIComponent("日本語")}`,
    });
    expect(wiki.document.title).toBe("日本語ページ - Site");
  });

  test("handles a page name with a double quote", async () => {
    const wiki = await openPage(`?page=${encodeURIComponent('a"b')}`, { Introduction: "?page=intro" });
    expect(wiki.document.title).toBe("Site");
  });

  test("prefers a link to all of the requested pages", async () => {
    const wiki = await openPage("?page=part-1,part-2", { Part1: "?page=part-1", Tutorial: "?page=part-1,part-2" });
    expect(wiki.document.title).toBe("Tutorial - Site");
  });

  test("falls back to a link to the first requested page", async () => {
    const wiki = await openPage("?page=part-1,part-2", { Tutorial: "?page=part-1,part-3", Part1: "?page=part-1" });
    expect(wiki.document.title).toBe("Part1 - Site");
  });

  test("trims the first requested page name", async () => {
    const wiki = await openPage(`?page=${encodeURIComponent(" intro")},example`, { Introduction: "?page=intro" });
    expect(wiki.document.title).toBe("Introduction - Site");
  });
});

describe("links that do not point to a page of this wiki", () => {
  const otherLinks = {
    Fragment: "#overview",
    Empty: "",
    OtherOrigin: "https://other.example/docs/index.html?page=intro",
    OtherPath: `${siteOrigin}/other/?page=intro`,
  };

  test("are not used for the tab title", async () => {
    const wiki = await openPage("?page=intro", { ...otherLinks, Introduction: "?page=intro" });
    expect(wiki.document.title).toBe("Introduction - Site");
  });

  test("are not marked active", async () => {
    const wiki = await openPage("?page=intro", { ...otherLinks, Introduction: "?page=intro" });
    expect(wiki.activeLabels()).toEqual(["Introduction"]);
  });
});

describe("active link", () => {
  test("marks only the link to the current page", async () => {
    const wiki = await openPage("?page=example", { Tables: "?page=example-table", Example: "?page=example" });
    expect(wiki.activeLabels()).toEqual(["Example"]);
  });

  test("marks a link to all of the requested pages", async () => {
    const wiki = await openPage("?page=part-1,part-2", { Part1: "?page=part-1", Tutorial: "?page=part-1,part-2" });
    expect(wiki.activeLabels()).toEqual(["Tutorial"]);
  });

  test("moves with navigation", async () => {
    const wiki = await openPage("?page=intro", { Introduction: "?page=intro", Example: "?page=example" });
    wiki.click('.lbw-sidebar a[href="?page=example"]');
    await vi.waitFor(() => expect(wiki.activeLabels()).toEqual(["Example"]));
    expect(wiki.document.title).toBe("Example - Site");
  });
});
