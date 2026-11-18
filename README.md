# lobster-wiki

> Markdown-driven wiki / multi-page site extension for [lobster.js](https://github.com/Hacknock/lobsterjs).

**[Demo →](https://Hacknock.github.io/lobster-wiki/)**

lobster-wiki turns a folder of Markdown files into a wiki-style site — sidebar navigation, page routing, auto-generated table of contents — with almost no code beyond the Markdown itself.

## Quick Start

Create a project with this structure:

```
my-wiki/
  index.html
  wiki.config.json
  nav.md
  header.md
  footer.md
  content/
    intro.md
    guide.md
```

Write `wiki.config.json`:

```json
{
  "title": "My Wiki",
  "navigation": "./nav.md",
  "header": "./header.md",
  "footer": "./footer.md",
  "defaultPage": "intro",
  "tableOfContents": true
}
```

`header` and `footer` are optional.
If you do not need them, remove those keys instead of leaving them pointing at missing files: every file listed in the config must exist, or the wiki stops loading.

Write `nav.md` as a nested list with `?page=` links:

```markdown
- Getting Started
  - [Introduction](?page=intro)
  - [Guide](?page=guide)
```

Write `header.md` and `footer.md` in Markdown:

```markdown
[**My Wiki**](?page=intro) Notes for the team
```

```markdown
Built with [lobster-wiki](https://github.com/Hacknock/lobster-wiki)
```

Write a minimal `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Wiki</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Hacknock/lobster-wiki@0.2/docs/style.css" />
  </head>
  <body>
    <script type="module">
      import { initWiki } from "https://cdn.jsdelivr.net/npm/@hacknock/lobster-wiki@0.2/dist/lobster-wiki.js";
      initWiki("./wiki.config.json");
    </script>
  </body>
</html>
```

Write your pages in `content/`, for example `content/intro.md`:

```markdown
# Introduction

Welcome to the wiki.

## Next steps

Read the [Guide](?page=guide).
```

Serve the folder with any static file server and open it in a browser:

```sh
cd my-wiki
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.
Opening `index.html` directly from disk (`file://`) does not work, because browsers block module scripts and file loading on `file://` pages.

## Pages

- A page is a Markdown file in `contentDir` (default `./content/`).
  `?page=guide` loads `content/guide.md`, and `?page=docs/setup` loads `content/docs/setup.md`.
- Without `?page=`, the wiki shows `defaultPage` (default `intro`).
- Link between pages with `?page=` links, in `nav.md`, `header.md`, `footer.md`, and pages alike.
  These links switch pages without reloading the site.
- `?page=part-1,part-2` shows `content/part-1.md` and `content/part-2.md` one after another as a single page.
- If a page cannot be loaded, for example because its file does not exist, the wiki shows a message in its place and logs the error to the browser console.
- The browser tab title is the label of the matching `nav.md` link followed by `title`, for example `Guide - My Wiki`.

## Navigation

`nav.md` is rendered with lobster.js into the sidebar, so any Markdown works there.
A nested list is the usual layout: list items without links act as group labels, and the link to the current page gets the `lbw-active` class.

## Publishing

lobster-wiki is a set of static files, so any static hosting works.
For GitHub Pages, put the contents of the site folder (`index.html`, `wiki.config.json`, and the rest) at the root of a repository or in its `docs/` folder, because those are the only folders GitHub Pages can publish from a branch.
Then choose **Settings → Pages → Deploy from a branch** and select the branch and that folder (`/ (root)` or `/docs`).

## Installation

### CDN

The Quick Start loads lobster-wiki from jsDelivr pinned to the `0.2` release line, so it receives patch releases only:

- Script: `https://cdn.jsdelivr.net/npm/@hacknock/lobster-wiki@0.2/dist/lobster-wiki.js`
- Stylesheet: `https://cdn.jsdelivr.net/gh/Hacknock/lobster-wiki@0.2/docs/style.css`

Replace `0.2` with an exact version such as `0.2.0` to pin it completely.

GitHub Pages also serves `https://hacknock.github.io/lobster-wiki/lobster-wiki.js` and `https://hacknock.github.io/lobster-wiki/style.css`.
They follow the main branch, so they can change, including breaking changes, before a release.

You can also download `lobster-wiki.js` from the [releases page](https://github.com/Hacknock/lobster-wiki/releases) and host it yourself.

### npm

```sh
npm install @hacknock/lobster-wiki
```

```ts
import { initWiki } from "@hacknock/lobster-wiki";
initWiki("./wiki.config.json");
```

## Features

- **SPA routing** — `?page=slug` query parameters with browser history support
- **Sidebar navigation** — loaded from a Markdown file (`nav.md`) with active link highlighting
- **Auto-generated table of contents** — builds an "On this page" section from headings (h2-h4)
- **Shared header / footer** — specify via `.md` file path in config
- **Responsive** — sidebar collapses on mobile, TOC hides on narrow screens
- **CSS-first** — wiki layout uses `lbw-*` classes; content uses lobster.js `lbs-*` classes

## Configuration

All options are defined in `wiki.config.json`:

| Key               | Description                                                                            | Default          |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------- |
| `title`           | Site title (used in `<title>`)                                                         | —                |
| `navigation`      | Path to sidebar navigation Markdown file (required)                                    | —                |
| `header`          | Path to header Markdown file                                                           | —                |
| `footer`          | Path to footer Markdown file                                                           | —                |
| `contentDir`      | Directory containing page Markdown files                                               | `./content/`     |
| `defaultPage`     | Default page slug when no `?page=` is specified                                        | `intro`          |
| `tableOfContents` | Enable auto-generated table of contents (`true` or `{ "minLevel": 2, "maxLevel": 4 }`) | `false`          |
| `lobsterUrl`      | URL to lobster.js                                                                      | jsDelivr `@hacknock/lobster@0.5` |

By default, lobster-wiki loads lobster.js from jsDelivr pinned to the `0.5` release line, so it receives patch releases only. Set `lobsterUrl` to use a different version or a self-hosted copy.

## Styling

The stylesheet in the Quick Start is `docs/style.css` in this repository, the stylesheet of the demo site, including the responsive layout.
Use it as is, or copy it and adjust it to make your own theme.

lobster-wiki builds this layout around your content:

```html
<header class="lbw-header">
  <div class="lbw-header-inner"><!-- header.md --></div>
</header>
<div class="lbw-body">
  <nav class="lbw-sidebar"><!-- nav.md --></nav>
  <main class="lbw-main"><!-- the current page --></main>
  <nav class="lbw-toc"><!-- table of contents, when enabled --></nav>
</div>
<footer class="lbw-footer"><!-- footer.md --></footer>
```

| Class | Element |
| ----- | ------- |
| `lbw-active` | The sidebar link to the current page |
| `lbw-not-found` | The message shown in place of a page that cannot be loaded |
| `lbw-toc-title` | The "On this page" heading of the table of contents |
| `lbw-toc-list` | The list of table of contents entries |
| `lbw-toc-item`, `lbw-toc-level-N` | A table of contents entry for a heading of level N |

The content itself is rendered by lobster.js with `lbs-*` classes, as described in the [lobster.js README](https://github.com/Hacknock/lobsterjs).

## Development

This project uses **npm** (declared via `devEngines`; requires `>=12.2.1` for the `min-release-age` setting in `.npmrc`, which blocks installation of package versions less than 7 days old as a supply-chain mitigation).

Use Node.js **24.22.3** (`.node-version`) and npm **12.2.1**, matching CI.

```bash
nodenv install -s
npm install -g npm@12.2.1
npm ci               # Install dependencies (uses package-lock.json)
npm test             # Type-check and run the tests (Vitest with happy-dom)
npm run test:watch   # Run the tests in watch mode
npm run build        # Build dist/lobster-wiki.js
npm run build:docs   # Build and copy to docs/ for GitHub Pages
```

## License

MIT
