// lobster-wiki.ts — Wiki/multi-page extension for lobster.js

// ============================================================
// Types
// ============================================================

export interface WikiConfig {
  /** Path to sidebar navigation Markdown file */
  navigation: string;
  /** Site title (used for <title> and header) */
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
  /** Routing mode: "query" uses ?page=, "hash" uses #page= (default: "query") */
  routing?: "query" | "hash";
  /** URL to lobster.js (default: "https://hacknock.github.io/lobsterjs/lobster.js") */
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
  "https://hacknock.github.io/lobsterjs/lobster.js";
const DEFAULT_CONTENT_DIR = "./content/";
const DEFAULT_PAGE = "intro";

// ============================================================
// Lobster.js dynamic loader
// ============================================================

type LoadMarkdownFn = (
  src: string | string[],
  container: HTMLElement
) => Promise<void>;

let _loadMarkdown: LoadMarkdownFn | null = null;

async function getLobster(
  url: string
): Promise<{ loadMarkdown: LoadMarkdownFn }> {
  if (_loadMarkdown) return { loadMarkdown: _loadMarkdown };
  const mod = await import(/* @vite-ignore */ url);
  _loadMarkdown = mod.loadMarkdown;
  return { loadMarkdown: mod.loadMarkdown };
}

// ============================================================
// Slugify helper
// ============================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  const headerInner = document.createElement("div");
  headerInner.className = "lbw-header-inner";
  if (config.title) {
    const logo = document.createElement("a");
    logo.className = "lbw-logo";
    logo.textContent = config.title;
    logo.href = getPageUrl(config.defaultPage ?? DEFAULT_PAGE, config);
    headerInner.appendChild(logo);
  }
  header.appendChild(headerInner);

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

function getRoutingMode(config: WikiConfig): "query" | "hash" {
  return config.routing ?? "query";
}

function getPageUrl(page: string, config: WikiConfig): string {
  if (getRoutingMode(config) === "hash") {
    return `#page=${page}`;
  }
  return `?page=${page}`;
}

function getCurrentPage(config: WikiConfig): string {
  const mode = getRoutingMode(config);
  const defaultPage = config.defaultPage ?? DEFAULT_PAGE;
  if (mode === "hash") {
    const hash = location.hash.slice(1); // remove #
    const params = new URLSearchParams(hash);
    return params.get("page") ?? defaultPage;
  }
  return new URLSearchParams(location.search).get("page") ?? defaultPage;
}

function setupRouter(
  config: WikiConfig,
  onNavigate: (page: string) => void
): void {
  const mode = getRoutingMode(config);

  // Intercept navigation links
  const linkSelector =
    mode === "hash" ? 'a[href*="#page="]' : 'a[href*="?page="]';

  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest?.(linkSelector) as HTMLAnchorElement | null;
    if (!a) return;
    e.preventDefault();

    let page: string | null;
    if (mode === "hash") {
      const hash = new URL(a.href, location.href).hash.slice(1);
      page = new URLSearchParams(hash).get("page");
    } else {
      page = new URL(a.href, location.href).searchParams.get("page");
    }

    if (!page) return;

    if (mode === "hash") {
      location.hash = `page=${page}`;
    } else {
      history.pushState({ page }, "", `?page=${page}`);
    }
    onNavigate(page);
  });

  // Browser back/forward
  if (mode === "hash") {
    window.addEventListener("hashchange", () => {
      onNavigate(getCurrentPage(config));
    });
  } else {
    window.addEventListener("popstate", (e) => {
      const page =
        (e.state as { page?: string })?.page ??
        config.defaultPage ??
        DEFAULT_PAGE;
      onNavigate(page);
    });
  }
}

// ============================================================
// WikiNav — sidebar navigation
// ============================================================

function updateActiveNav(
  sidebar: HTMLElement,
  page: string,
  config: WikiConfig
): void {
  const mode = getRoutingMode(config);
  sidebar.querySelectorAll("a").forEach((a) => {
    let linkPage: string | null;
    if (mode === "hash") {
      const hash = new URL(a.href, location.href).hash.slice(1);
      linkPage = new URLSearchParams(hash).get("page");
    } else {
      linkPage = new URL(a.href, location.href).searchParams.get("page");
    }
    a.classList.toggle("lbw-active", linkPage === page);
  });
}

function updateTitle(
  sidebar: HTMLElement,
  page: string,
  siteTitle: string | undefined
): void {
  const first = page.split(",")[0];
  const link = sidebar.querySelector(
    `a[href*="page=${first}"]`
  ) as HTMLAnchorElement | null;
  const label = link?.textContent?.trim();
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
      .filter((l) => l >= minLevel && l <= maxLevel)
      .map((l) => `.lbs-heading-${l}`)
      .join(",")
  );

  headings.forEach((el) => {
    const level = parseInt(
      Array.from(el.classList)
        .find((c) => c.startsWith("lbs-heading-"))
        ?.replace("lbs-heading-", "") ?? "2",
      10
    );
    const text = el.textContent?.trim() ?? "";
    // Use existing id or generate one
    if (!el.id) {
      el.id = slugify(text);
    }
    entries.push({ level, text, id: el.id });
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
    const li = document.createElement("li");
    li.className = `lbw-toc-item lbw-toc-level-${entry.level}`;
    const a = document.createElement("a");
    a.href = `#${entry.id}`;
    a.textContent = entry.text;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById(entry.id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        history.replaceState(null, "", `#${entry.id}`);
      }
    });
    li.appendChild(a);
    list.appendChild(li);
  }

  tocNav.innerHTML = "";
  tocNav.appendChild(title);
  tocNav.appendChild(list);
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
    const headerContent = document.createElement("div");
    headerContent.className = "lbw-header-content";
    shell.header.querySelector(".lbw-header-inner")!.appendChild(headerContent);
    await loadMarkdown(config.header, headerContent);
  }

  // Load footer content
  if (config.footer) {
    await loadMarkdown(config.footer, shell.footer);
  }

  // Load sidebar navigation
  await loadMarkdown(config.navigation, shell.sidebar);

  // Page loader
  async function loadPage(page: string): Promise<void> {
    const srcs = page
      .split(",")
      .map((p) => `${contentDir}${p.trim()}.md`);
    await loadMarkdown(srcs.length === 1 ? srcs[0] : srcs, shell.main);

    updateActiveNav(shell.sidebar, page, config);
    updateTitle(shell.sidebar, page, config.title);
    window.scrollTo(0, 0);

    // Build TOC after content is rendered
    if (config.tableOfContents) {
      const entries = buildToc(shell.main, config);
      renderToc(shell.toc, entries);
    }
  }

  // Set up routing
  setupRouter(config, loadPage);

  // Load initial page
  const initialPage = getCurrentPage(config);
  await loadPage(initialPage);
}
