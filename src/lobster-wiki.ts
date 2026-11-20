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
  /** Table of contents configuration; levels are 1 to 6 (default: false, or levels 2 to 4 when enabled) */
  tableOfContents?: boolean | { minLevel?: number; maxLevel?: number };
  /** URL to lobster.js (default: "https://cdn.jsdelivr.net/npm/@hacknock/lobster@0.6/dist/lobster.js") */
  lobsterUrl?: string;
}

interface TocEntry {
  level: number;
  depth: number;
  text: string;
  id: string;
}

const DEFAULT_LOBSTER_URL =
  "https://cdn.jsdelivr.net/npm/@hacknock/lobster@0.6/dist/lobster.js";
const DEFAULT_CONTENT_DIR = "./content/";
const DEFAULT_PAGE = "intro";

type LoadMarkdownFunction = (
  source: string | string[],
  container: HTMLElement
) => Promise<void>;

async function importLoadMarkdown(url: string): Promise<LoadMarkdownFunction> {
  const lobsterModule = await import(/* @vite-ignore */ url);
  return lobsterModule.loadMarkdown;
}

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

interface ShellElements {
  headerInner: HTMLElement;
  sidebar: HTMLElement;
  main: HTMLElement;
  toc: HTMLElement;
  footer: HTMLElement;
}

function createElement<Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  className: string
): HTMLElementTagNameMap[Tag] {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

function createShell(config: WikiConfig): ShellElements {
  const header = createElement("header", "lbw-header");
  const headerInner = createElement("div", "lbw-header-inner");
  header.appendChild(headerInner);

  const body = createElement("div", "lbw-body");
  const sidebar = createElement("nav", "lbw-sidebar");
  const main = createElement("main", "lbw-main");
  const toc = createElement("nav", "lbw-toc");
  body.append(sidebar, main);
  if (config.tableOfContents) body.appendChild(toc);

  const footer = createElement("footer", "lbw-footer");

  document.body.replaceChildren(header, body, footer);
  return { headerInner, sidebar, main, toc, footer };
}

function splitPageNames(page: string): string[] {
  return page.split(",").map((pageName) => pageName.trim());
}

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

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;

    const link = (event.target as Element).closest?.<HTMLAnchorElement>('a[href*="?page="]');
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

  window.addEventListener("popstate", () => {
    const page = getCurrentPage(config);
    if (page !== currentPage) navigate(page);
  });
}

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
  const [firstPage] = splitPageNames(page);
  const sidebarLinks = Array.from(sidebar.querySelectorAll("a"));
  const titleLink =
    sidebarLinks.find((link) => getLinkPage(link) === page) ??
    sidebarLinks.find((link) => getLinkPage(link) === firstPage);
  const label = titleLink?.textContent?.trim();
  document.title = label && siteTitle
    ? `${label} - ${siteTitle}`
    : label ?? siteTitle ?? "";
}

function buildToc(main: HTMLElement, config: WikiConfig): TocEntry[] {
  const tocConfig =
    typeof config.tableOfContents === "object" ? config.tableOfContents : {};
  const minLevel = tocConfig.minLevel ?? 2;
  const maxLevel = tocConfig.maxLevel ?? 4;

  const selectors = [1, 2, 3, 4, 5, 6]
    .filter((level) => level >= minLevel && level <= maxLevel)
    .map((level) => `.lbs-heading-${level}`);
  if (selectors.length === 0) return [];

  const entries: TocEntry[] = [];
  const headings = main.querySelectorAll<HTMLElement>(selectors.join(","));

  const usedIds = new Set(
    Array.from(document.querySelectorAll("[id]"), (element) => element.id)
  );

  headings.forEach((heading) => {
    const level = Number(heading.tagName.slice(1));
    const text = heading.textContent?.trim() ?? "";
    if (!heading.id) heading.id = uniqueSlug(text, usedIds);
    entries.push({ level, depth: level - Math.max(minLevel, 1), text, id: heading.id });
  });

  return entries;
}

function renderToc(tocNav: HTMLElement, entries: TocEntry[]): void {
  if (entries.length === 0) {
    tocNav.replaceChildren();
    return;
  }

  const title = createElement("div", "lbw-toc-title");
  title.textContent = "On this page";

  const list = createElement("ul", "lbw-toc-list");

  for (const entry of entries) {
    const item = createElement("li", `lbw-toc-item lbw-toc-level-${entry.level} lbw-toc-depth-${entry.depth}`);
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

  tocNav.replaceChildren(title, list);
}

function renderPageLoadError(container: HTMLElement, page: string): void {
  const paragraph = createElement("p", "lbs-paragraph");
  paragraph.textContent = `This page could not be loaded: ${page}`;
  const message = createElement("div", "lbw-not-found");
  message.appendChild(paragraph);
  container.replaceChildren(message);
}

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

  const contentDir = config.contentDir ?? DEFAULT_CONTENT_DIR;
  const loadMarkdown = await importLoadMarkdown(config.lobsterUrl ?? DEFAULT_LOBSTER_URL);
  const shell = createShell(config);

  if (config.header) await loadMarkdown(config.header, shell.headerInner);
  if (config.footer) await loadMarkdown(config.footer, shell.footer);
  await loadMarkdown(config.navigation, shell.sidebar);

  let latestPageLoad = 0;

  async function loadPage(page: string): Promise<void> {
    const pageLoad = ++latestPageLoad;
    const sources = splitPageNames(page).map((pageName) => `${contentDir}${pageName}.md`);
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

    if (config.tableOfContents) renderToc(shell.toc, buildToc(shell.main, config));

    const fragmentTarget = getFragmentTarget();
    if (fragmentTarget) {
      fragmentTarget.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  setupRouter(config, loadPage);
  await loadPage(getCurrentPage(config));
}
