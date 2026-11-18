import { Window } from "happy-dom";
import { expect, onTestFinished, vi } from "vitest";
import type { WikiConfig } from "../../src/lobster-wiki";
import { settledEventName } from "./lobster-stub";

export const siteOrigin = "https://wiki.example";
export const sitePath = "/docs/index.html";

export const lobsterStubUrl = new URL("./lobster-stub.ts", import.meta.url).href;

export type WikiFile = string | (() => Promise<string | null>);

export interface StartWikiOptions {
  files: Record<string, WikiFile>;
  search?: string;
  config?: Partial<WikiConfig> | string;
  expectConsoleErrors?: boolean;
}

export interface ClickOptions {
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  button?: number;
}

export function deferred<Value>(): {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
} {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

export function sidebar(links: Record<string, string>): string {
  return Object.entries(links)
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join("");
}

function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function startWiki(options: StartWikiOptions) {
  const window = new Window({
    url: `${siteOrigin}${sitePath}${options.search ?? ""}`,
    settings: { navigation: { disableMainFrameNavigation: true } },
  });
  const requests: string[] = [];

  const fetchFile = async (input: string): Promise<Response> => {
    const url = new URL(input);
    const path = decodeURIComponent(url.pathname).replace(/^\/docs\//, "");
    requests.push(path);
    const file = options.files[path];
    const body = typeof file === "function" ? await file() : file;
    return body === undefined || body === null
      ? new Response("", { status: 404, statusText: "Not Found" })
      : new Response(body);
  };

  vi.stubGlobal("window", window);
  vi.stubGlobal("document", window.document);
  vi.stubGlobal("location", window.location);
  vi.stubGlobal("history", window.history);
  vi.stubGlobal("fetch", fetchFile);

  const scrollIntoView = vi.spyOn(window.Element.prototype, "scrollIntoView");
  const scrollTo = vi.spyOn(window, "scrollTo");
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  onTestFinished(async () => {
    if (!options.expectConsoleErrors) expect(consoleError).not.toHaveBeenCalled();
    await window.happyDOM.close();
  });

  const interceptedClicks: boolean[] = [];
  window.addEventListener("click", (event) => {
    interceptedClicks.push(event.defaultPrevented);
    event.preventDefault();
  });

  const settledSources: string[][] = [];
  window.addEventListener(settledEventName, (event) => {
    settledSources.push((event as unknown as CustomEvent<string[]>).detail);
  });

  vi.resetModules();
  const { initWiki } = await import("../../src/lobster-wiki");
  const started = initWiki(
    typeof options.config === "string"
      ? options.config
      : { navigation: "./nav.md", lobsterUrl: lobsterStubUrl, ...options.config }
  );

  const document = window.document;

  const click = (selector: string, clickOptions: ClickOptions = {}): boolean => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`No element matches ${selector}`);
    element.dispatchEvent(
      new window.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: clickOptions.button ?? 0,
        ctrlKey: clickOptions.ctrlKey,
        metaKey: clickOptions.metaKey,
        altKey: clickOptions.altKey,
        shiftKey: clickOptions.shiftKey,
      })
    );
    return interceptedClicks[interceptedClicks.length - 1];
  };

  const pageLoadSettled = async (path: string): Promise<void> => {
    await vi.waitFor(() => {
      expect(settledSources.some((sources) => sources.includes(path))).toBe(true);
    });
    await nextTask();
  };

  return {
    window,
    document,
    requests,
    started,
    click,
    pageLoadSettled,
    scrollIntoView,
    scrollTo,
    consoleError,
    lastScrolledElement: () => scrollIntoView.mock.contexts[scrollIntoView.mock.contexts.length - 1],
    main: () => document.querySelector(".lbw-main")!,
    url: () => `${window.location.search}${window.location.hash}`,
    activeLabels: () =>
      Array.from(document.querySelectorAll(".lbw-active"), (link) => link.textContent),
  };
}
