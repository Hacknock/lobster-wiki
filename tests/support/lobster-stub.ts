export const settledEventName = "lobster-stub-settled";

export async function loadMarkdown(
  source: string | string[],
  container: HTMLElement
): Promise<void> {
  const sources = Array.isArray(source) ? source : [source];
  try {
    const texts = await Promise.all(
      sources.map(async (path) => {
        const response = await fetch(new URL(path, location.href).href);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${path}: ${response.status}`);
        }
        return response.text();
      })
    );
    container.innerHTML = texts.join("\n");
  } finally {
    window.dispatchEvent(new window.CustomEvent(settledEventName, { detail: sources }));
  }
}
