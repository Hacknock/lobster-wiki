# Introduction

**lobster.js** is an extended Markdown parser that renders rich, structured web pages directly in the browser — no build step, no framework required.

You write a Markdown file, point lobster.js at it, and get a fully structured HTML document. Appearance is entirely up to CSS via predictable `lbs-*` class names.

## Quick start

Add a single `<script type="module">` to your HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="your-style.css" />
  </head>
  <body>
    <div id="content"></div>
    <script type="module">
      import { loadMarkdown } from "https://hacknock.github.io/lobsterjs/lobster.js";
      loadMarkdown("./content.md", document.getElementById("content"));
    </script>
  </body>
</html>
```

That's it. No npm install. No bundler. No configuration.

## Features

| Category | What you get |
| :--- | :--- |
| Standard Markdown | Headings, paragraphs, bold, italic, strikethrough, code, blockquotes, lists, tables, links, images |
| Extended syntax | `:::header` / `:::footer`, `:::details`, `:::warp`, silent tables, cell merging, image sizing, footnotes |
| CSS-first | Every element gets a `lbs-*` class — bring your own stylesheet |
| Multi-file | Pass an array to `loadMarkdown` to merge files; warp/link/footnote refs are shared |
| TypeScript | Full type definitions included |

## API at a glance

### `loadMarkdown(src, container)`

Fetches and renders Markdown into a DOM element.

```js
import { loadMarkdown } from "./lobster.js";

// Single file
loadMarkdown("./content.md", document.getElementById("content"));

// Multiple files — merged before parsing
loadMarkdown(["./shared.md", "./page.md"], document.getElementById("content"));
```

### `toHTML(markdown)`

One-liner for server-side or offline use:

```js
import { toHTML } from "lobsterjs";
const html = toHTML("# Hello **world**");
```

## Extended syntax overview

lobster.js adds the following on top of standard Markdown:

- **`:::header` / `:::footer`** — semantic page regions
- **`:::details`** — native `<details>` / `<summary>` collapsible blocks
- **`:::warp`** — define content once, place it anywhere (multi-column layouts)
- **Silent tables** (`~ | … |`) — borderless layout grids
- **Cell merging** — horizontal (`\|`) and vertical (`\---`) spans
- **Image sizing** — `![alt](url =800x)`
- **Footnotes** — reference (`[^id]`) and inline (`^[text]`)

Explore each feature in the sidebar examples.

## CSS classes

Every rendered element carries a `lbs-*` class. No default stylesheet is bundled.

```
lbs-heading-1 … lbs-heading-6   Headings
lbs-paragraph                    Paragraph
lbs-emphasis / lbs-strong        Inline
lbs-code-span / lbs-code-block   Code
lbs-table / lbs-table-silent     Tables
lbs-details / lbs-summary        Collapsible
lbs-footnote-ref / lbs-footnotes Footnotes
```

---

> **This showcase** is itself built with lobster.js. The sidebar is `nav.md`, and each page is a separate Markdown file loaded dynamically via `?page=` query parameters.
