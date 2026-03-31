# Details / Collapsible

The `:::details` block renders as a native HTML `<details>` / `<summary>` element — no JavaScript required for the toggle behavior.

## Basic usage

```markdown
:::details Click to expand
Hidden content is revealed when the user clicks the summary.

You can put **any** Markdown here — paragraphs, lists, code blocks, tables.
:::
```

**Result:**

:::details Click to expand
Hidden content is revealed when the user clicks the summary.

You can put **any** Markdown here — paragraphs, lists, code blocks, tables.
:::

## Rich content inside details

Any lobster.js Markdown is valid inside a `:::details` block:

```markdown
:::details API reference

| Function        | Returns  | Description             |
| :-------------- | :------- | :---------------------- |
| `loadMarkdown`  | Promise  | Fetch & render to DOM   |
| `toHTML`        | string   | Parse & render to HTML  |
| `parseDocument` | Document | Parse to AST            |
| `renderDocument`| string   | Render AST to HTML      |

:::
```

**Result:**

:::details API reference

| Function         | Returns  | Description            |
| :--------------- | :------- | :--------------------- |
| `loadMarkdown`   | Promise  | Fetch & render to DOM  |
| `toHTML`         | string   | Parse & render to HTML |
| `parseDocument`  | Document | Parse to AST           |
| `renderDocument` | string   | Render AST to HTML     |

:::

## Code in details

:::details Show full example

```js
import { loadMarkdown } from "https://hacknock.github.io/lobsterjs/lobster.js";

const content = document.getElementById("content");

// Single file
await loadMarkdown("./content.md", content);

// Multiple files — merged before parsing
await loadMarkdown(["./shared.md", "./content.md"], content);
```

:::

## Multiple collapsible sections

:::details What is a warp block?
A warp block (`:::warp id`) lets you define content once and place it anywhere via `[~id]` references. It's the foundation of multi-column layouts.
:::

:::details Does lobster.js require npm?
No. You can use it directly via CDN with a `<script type="module">`. No npm, no bundler, no build step required.
:::

:::details What CSS classes does lobster.js use?
Every element gets an `lbs-*` class. See the [Introduction](?page=intro) for the full class reference.
:::

## HTML output

```html
<details class="lbs-details">
  <summary class="lbs-summary">Click to expand</summary>
  <!-- content rendered here -->
</details>
```

The `open` attribute works as expected — browsers remember the state and screen readers announce it correctly.
