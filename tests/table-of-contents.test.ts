import { afterEach, describe, expect, test, vi } from "vitest";
import type { WikiConfig } from "../src/lobster-wiki";
import { sidebar, startWiki } from "./support/wiki-harness";

function headings(...entries: [number, string][]): string {
  return entries.map(([level, text]) => `<h${level} class="lbs-heading-${level}">${text}</h${level}>`).join("");
}

async function openPage(page: string, tableOfContents: WikiConfig["tableOfContents"] = true, extraFiles = {}) {
  const wiki = await startWiki({
    files: {
      "nav.md": sidebar({ Introduction: "?page=intro", Empty: "?page=empty" }),
      "content/intro.md": page,
      "content/empty.md": "<p>No headings</p>",
      ...extraFiles,
    },
    config: { tableOfContents },
  });
  await wiki.started;
  const entries = () =>
    Array.from(wiki.document.querySelectorAll(".lbw-toc-item a"), (link) => ({
      text: link.textContent,
      href: link.getAttribute("href"),
      className: link.parentElement?.className,
    }));
  return { ...wiki, entries };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("configuration", () => {
  test("is not added when disabled", async () => {
    const wiki = await openPage(headings([2, "Setup"]), false);
    expect(wiki.document.querySelector(".lbw-toc")).toBeNull();
  });

  test("lists h2 to h4 by default", async () => {
    const wiki = await openPage(headings([1, "Title"], [2, "Two"], [3, "Three"], [4, "Four"], [5, "Five"]));
    expect(wiki.document.querySelector(".lbw-toc-title")?.textContent).toBe("On this page");
    expect(wiki.entries()).toEqual([
      { text: "Two", href: "#two", className: "lbw-toc-item lbw-toc-level-2" },
      { text: "Three", href: "#three", className: "lbw-toc-item lbw-toc-level-3" },
      { text: "Four", href: "#four", className: "lbw-toc-item lbw-toc-level-4" },
    ]);
  });

  test("follows minLevel and maxLevel", async () => {
    const wiki = await openPage(headings([2, "Two"], [3, "Three"], [4, "Four"], [5, "Five"]), { minLevel: 3, maxLevel: 5 });
    expect(wiki.entries().map((entry) => entry.text)).toEqual(["Three", "Four", "Five"]);
  });

  test("is emptied on a page without headings", async () => {
    const wiki = await openPage(headings([2, "Setup"]));
    wiki.click('.lbw-sidebar a[href="?page=empty"]');
    await vi.waitFor(() => expect(wiki.main().textContent).toBe("No headings"));
    expect(wiki.document.querySelector(".lbw-toc")?.innerHTML).toBe("");
  });
});

describe("heading ids", () => {
  test.each([
    ["spaces and case", "Getting Started", "getting-started"],
    ["symbols", "What's new?", "whats-new"],
    ["Japanese text", "はじめに", "はじめに"],
    ["an emoji with a variation selector", "❤️ Love", "love"],
    ["a keycap emoji", "1️⃣ First", "1-first"],
    ["combining marks", "Café", "café"],
    ["only symbols", "!!!", "heading"],
  ])("are made from %s", async (_case, text, id) => {
    const wiki = await openPage(headings([2, text]));
    expect(wiki.main().querySelector(".lbs-heading-2")?.id).toBe(id);
  });

  test("get a suffix when they repeat", async () => {
    const wiki = await openPage(headings([2, "Setup"], [2, "Setup"], [2, "Setup"]));
    expect(wiki.entries().map((entry) => entry.href)).toEqual(["#setup", "#setup-1", "#setup-2"]);
  });

  test("avoid ids already used in the document", async () => {
    const wiki = await openPage(`<p id="setup">Note</p>${headings([2, "Setup"])}`);
    expect(wiki.entries().map((entry) => entry.href)).toEqual(["#setup-1"]);
  });

  test("keep an id the heading already has", async () => {
    const wiki = await openPage('<h2 id="custom" class="lbs-heading-2">Setup</h2>');
    expect(wiki.entries().map((entry) => entry.href)).toEqual(["#custom"]);
  });
});

test("clicking an entry scrolls to the heading and updates the fragment", async () => {
  const wiki = await openPage(headings([2, "Setup"]));
  wiki.click('.lbw-toc-item a[href="#setup"]');
  expect(wiki.scrollIntoView.mock.contexts.at(-1)).toBe(wiki.document.getElementById("setup"));
  expect(wiki.url()).toBe("#setup");
});
