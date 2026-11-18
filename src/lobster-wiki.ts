// lobster-wiki.ts — Wiki/multi-page extension for lobster.js

// ============================================================
// Types
// ============================================================

export interface WikiConfig {
  /** Path to sidebar navigation Markdown file */
  navigation: string;
  /** Site title (used for <title>) */
  title?: string;
  /** Path to header Markdown file */
  header?: string;
  /** Path to footer Markdown file */
  footer?: string;
  /** Directory containing page Markdown files (default: "./content/") */
  contentDir?: string;
  /** Default page slug when no ?page= is specified (default: "intro") */
  defaultPage?: string;
  /** Table of contents configuration (default: false) */
  tableOfContents?: boolean | { minLevel?: number; maxLevel?: number };
  /** URL to lobster.js (default: "https://cdn.jsdelivr.net/npm/@hacknock/lobster@0.5/dist/lobster.js") */
  lobsterUrl?: string;
}

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_LOBSTER_URL =
  "https://cdn.jsdelivr.net/npm/@hacknock/lobster@0.5/dist/lobster.js";
const DEFAULT_CONTENT_DIR = "./content/";
const DEFAULT_PAGE = "intro";

// ============================================================
// Lobster.js dynamic loader
// ============================================================

type LoadMarkdownFunction = (
  src: string | string[],
  container: HTMLElement
) => Promise<void>;

let cachedLoadMarkdown: LoadMarkdownFunction | null = null;

async function getLobster(
  url: string
): Promise<{ loadMarkdown: LoadMarkdownFunction }> {
  if (cachedLoadMarkdown) return { loadMarkdown: cachedLoadMarkdown };
  const lobsterModule = await import(/* @vite-ignore */ url);
  cachedLoadMarkdown = lobsterModule.loadMarkdown;
  return { loadMarkdown: lobsterModule.loadMarkdown };
}

// ============================================================
// Slugify helper
// ============================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u{FE00}-\u{FE0F}\u{20E3}\u{E0100}-\u{E01EF}]/gu, "")
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(text: string, usedIds: Set<string>): string {
  const base = slugify(text) || "heading";
  let candidate = base;
  for (let suffix = 1; usedIds.has(candidate); suffix++) {
    candidate = `${base}-${suffix}`;
  }
  usedIds.add(candidate);
  return candidate;
}

// ============================================================
// WikiShell — DOM scaffold
// ============================================================

interface ShellElements {
  header: HTMLElement;
  sidebar: HTMLElement;
  main: HTMLElement;
  toc: HTMLElement;
  footer: HTMLElement;
}

function createShell(config: WikiConfig): ShellElements {
  // Clear body
  document.body.innerHTML = "";

  // Header
  const header = document.createElement("header");
  header.className = "lbw-header";
  header.appendChild(document.createElement("div"));
  header.firstElementChild!.className = "lbw-header-inner";

  // Body container
  const body = document.createElement("div");
  body.className = "lbw-body";

  // Sidebar
  const sidebar = document.createElement("nav");
  sidebar.className = "lbw-sidebar";

  // Main
  const main = document.createElement("main");
  main.className = "lbw-main";

  // TOC
  const toc = document.createElement("nav");
  toc.className = "lbw-toc";

  body.appendChild(sidebar);
  body.appendChild(main);
  if (config.tableOfContents) {
    body.appendChild(toc);
  }

  // Footer
  const footer = document.createElement("footer");
  footer.className = "lbw-footer";

  document.body.appendChild(header);
  document.body.appendChild(body);
  document.body.appendChild(footer);

  return { header, sidebar, main, toc, footer };
}

// ============================================================
// WikiRouter — SPA routing
// ============================================================

function getCurrentPage(config: WikiConfig): string {
  const defaultPage = config.defaultPage ?? DEFAULT_PAGE;
  return new URLSearchParams(location.search).get("page") ?? defaultPage;
}

function getFragmentTarget(): HTMLElement | null {
  const fragment = location.hash.slice(1);
  if (!fragment) return null;
  const target = document.getElementById(fragment);
  if (target) return target;
  try {
    return document.getElementById(decodeURIComponent(fragment));
  } catch {
    return null;
  }
}

function getLinkPage(link: HTMLAnchorElement): string | null {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#")) return null;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) {
    return null;
  }
  return url.searchParams.get("page");
}

function setupRouter(
  config: WikiConfig,
  onNavigate: (page: string) => void
): void {
  let currentPage = getCurrentPage(config);
  const navigate = (page: string) => {
    currentPage = page;
    onNavigate(page);
  };

  // Intercept navigation links
  const linkSelector = 'a[href*="?page="]';

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;

    const link = (event.target as Element).closest?.(linkSelector) as HTMLAnchorElement | null;
    if (!link) return;

    if (
      (link.target && link.target !== "_self") ||
      link.hasAttribute("download") ||
      event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
    ) {
      return;
    }

    const page = getLinkPage(link);
    if (page === null) return;

    event.preventDefault();
    if (!page) return;

    history.pushState(null, "", link.search + link.hash);
    navigate(page);
  });

  // Browser back/forward
  window.addEventListener("popstate", () => {
    const page = getCurrentPage(config);
    if (page !== currentPage) navigate(page);
  });
}

// ============================================================
// WikiNav — sidebar navigation
// ============================================================

function updateActiveNav(sidebar: HTMLElement, page: string): void {
  sidebar.querySelectorAll("a").forEach((link) => {
    link.classList.toggle("lbw-active", getLinkPage(link) === page);
  });
}

function updateTitle(
  sidebar: HTMLElement,
  page: string,
  siteTitle: string | undefined
): void {
  const first = page.split(",")[0].trim();
  const sidebarLinks = Array.from(sidebar.querySelectorAll("a"));
  const titleLink =
    sidebarLinks.find((link) => getLinkPage(link) === page) ??
    sidebarLinks.find((link) => getLinkPage(link) === first);
  const label = titleLink?.textContent?.trim();
  document.title = label && siteTitle
    ? `${label} - ${siteTitle}`
    : label ?? siteTitle ?? "";
}

// ============================================================
// WikiTOC — auto-generated table of contents
// ============================================================

function buildToc(main: HTMLElement, config: WikiConfig): TocEntry[] {
  const tocConfig =
    typeof config.tableOfContents === "object" ? config.tableOfContents : {};
  const minLevel = tocConfig.minLevel ?? 2;
  const maxLevel = tocConfig.maxLevel ?? 4;

  const entries: TocEntry[] = [];
  const headings = main.querySelectorAll<HTMLElement>(
    [2, 3, 4, 5, 6]
      .filter((level) => level >= minLevel && level <= maxLevel)
      .map((level) => `.lbs-heading-${level}`)
      .join(",")
  );

  const usedIds = new Set(
    Array.from(document.querySelectorAll("[id]"), (element) => element.id)
  );

  headings.forEach((heading) => {
    const level = parseInt(
      Array.from(heading.classList)
        .find((className) => className.startsWith("lbs-heading-"))
        ?.replace("lbs-heading-", "") ?? "2",
      10
    );
    const text = heading.textContent?.trim() ?? "";
    // Use existing id or generate one
    if (!heading.id) {
      heading.id = uniqueSlug(text, usedIds);
    }
    entries.push({ level, text, id: heading.id });
  });

  return entries;
}

function renderToc(tocNav: HTMLElement, entries: TocEntry[]): void {
  if (entries.length === 0) {
    tocNav.innerHTML = "";
    return;
  }

  const title = document.createElement("div");
  title.className = "lbw-toc-title";
  title.textContent = "On this page";

  const list = document.createElement("ul");
  list.className = "lbw-toc-list";

  for (const entry of entries) {
    const item = document.createElement("li");
    item.className = `lbw-toc-item lbw-toc-level-${entry.level}`;
    const link = document.createElement("a");
    link.href = `#${entry.id}`;
    link.textContent = entry.text;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.getElementById(entry.id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        history.replaceState(null, "", `#${entry.id}`);
      }
    });
    item.appendChild(link);
    list.appendChild(item);
  }

  tocNav.innerHTML = "";
  tocNav.appendChild(title);
  tocNav.appendChild(list);
}

function renderPageLoadError(container: HTMLElement, page: string): void {
  const paragraph = document.createElement("p");
  paragraph.className = "lbs-paragraph";
  paragraph.textContent = `This page could not be loaded: ${page}`;
  const message = document.createElement("div");
  message.className = "lbw-not-found";
  message.appendChild(paragraph);
  container.replaceChildren(message);
}

// ============================================================
// initWiki — main entry point
// ============================================================

/**
 * Initialize a lobster-wiki site.
 * @param configOrUrl - A WikiConfig object or a path to a JSON config file.
 */
export async function initWiki(
  configOrUrl: WikiConfig | string
): Promise<void> {
  let config: WikiConfig;
  if (typeof configOrUrl === "string") {
    const response = await fetch(new URL(configOrUrl, location.href).href);
    if (!response.ok) {
      throw new Error(
        `Failed to load wiki config from ${configOrUrl}: ${response.status} ${response.statusText}`
      );
    }
    config = await response.json();
  } else {
    config = configOrUrl;
  }

  const lobsterUrl = config.lobsterUrl ?? DEFAULT_LOBSTER_URL;
  const contentDir = config.contentDir ?? DEFAULT_CONTENT_DIR;

  // Load lobster.js
  const { loadMarkdown } = await getLobster(lobsterUrl);

  // Create DOM scaffold
  const shell = createShell(config);

  // Load header content
  if (config.header) {
    await loadMarkdown(config.header, shell.header.querySelector(".lbw-header-inner")!);
  }

  // Load footer content
  if (config.footer) {
    await loadMarkdown(config.footer, shell.footer);
  }

  // Load sidebar navigation
  await loadMarkdown(config.navigation, shell.sidebar);

  let latestPageLoad = 0;

  // Page loader
  async function loadPage(page: string): Promise<void> {
    const pageLoad = ++latestPageLoad;
    const sources = page
      .split(",")
      .map((pageName) => `${contentDir}${pageName.trim()}.md`);
    const content = document.createElement("div");
    try {
      await loadMarkdown(sources.length === 1 ? sources[0] : sources, content);
    } catch (error) {
      console.error(error);
      renderPageLoadError(content, page);
    }
    if (pageLoad !== latestPageLoad) return;
    shell.main.replaceChildren(...content.childNodes);

    updateActiveNav(shell.sidebar, page);
    updateTitle(shell.sidebar, page, config.title);

    // Build TOC after content is rendered
    if (config.tableOfContents) {
      const entries = buildToc(shell.main, config);
      renderToc(shell.toc, entries);
    }

    const fragmentTarget = getFragmentTarget();
    if (fragmentTarget) {
      fragmentTarget.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  // Set up routing
  setupRouter(config, loadPage);

  // Load initial page
  const initialPage = getCurrentPage(config);
  await loadPage(initialPage);
}
