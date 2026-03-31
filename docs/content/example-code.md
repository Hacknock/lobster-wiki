# Code Blocks

lobster.js renders both **inline code** and **fenced code blocks**, with optional filename annotations and syntax highlighting integration.

## Inline code

Wrap text in backticks for inline code:

```markdown
Call `loadMarkdown(src, container)` to render Markdown into the DOM.
```

**Result:**

Call `loadMarkdown(src, container)` to render Markdown into the DOM.

## Fenced code blocks

Use triple backticks. Add a language identifier for syntax highlighting:

````markdown
```js
import { loadMarkdown } from "https://hacknock.github.io/lobsterjs/lobster.js";

loadMarkdown("./content.md", document.getElementById("content"));
```
````

**Result:**

```js
import { loadMarkdown } from "https://hacknock.github.io/lobsterjs/lobster.js";

loadMarkdown("./content.md", document.getElementById("content"));
```

## Code block with filename

Add a filename on the line immediately before the opening fence:

````markdown
```html style.css
body {
  font-family: system-ui, sans-serif;
}
```
````

**Result:**

```html style.css
body {
  font-family: system-ui, sans-serif;
}
```

The filename is rendered as a `.lbs-code-filename` element above the code.

## Supported languages

lobster.js emits a `language-*` class on the `<code>` element — the standard convention used by popular highlighters. No highlighter is bundled; add your own:

### Prism.js

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs/themes/prism.min.css" />
<script src="https://cdn.jsdelivr.net/npm/prismjs/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs/plugins/autoloader/prism-autoloader.min.js"></script>
```

```js
loadMarkdown("./content.md", content).then(() => Prism.highlightAll());
```

### highlight.js

```js
import hljs from "highlight.js";
loadMarkdown("./content.md", content).then(() => hljs.highlightAll());
```

## HTML output

A fenced code block with a language and filename renders as:

```html
<div class="lbs-code-block">
  <p class="lbs-code-filename">style.css</p>
  <pre data-language="html"><code class="language-html">…</code></pre>
</div>
```

Style it via `.lbs-code-block`, `.lbs-code-filename`, and standard `pre` / `code` selectors.
