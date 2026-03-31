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
  content/
    intro.md
    guide.md
```

Write `wiki.config.json`:

```json
{
  "title": "My Wiki",
  "navigation": "./nav.md",
  "footer": "./footer.md",
  "defaultPage": "intro",
  "tableOfContents": true
}
```

Write `nav.md` as a nested list with `?page=` links:

```markdown
- Getting Started
  - [Introduction](?page=intro)
  - [Guide](?page=guide)
```

Write a minimal `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Wiki</title>
    <link rel="stylesheet" href="https://hacknock.github.io/lobster-wiki/style.css" />
  </head>
  <body>
    <script type="module">
      import { initWiki } from "https://hacknock.github.io/lobster-wiki/lobster-wiki.js";
      initWiki("./wiki.config.json");
    </script>
  </body>
</html>
```

Write your content pages in `content/` and serve with any static file server.

## Features

- **SPA routing** — `?page=slug` query parameters with browser history support
- **Sidebar navigation** — loaded from a Markdown file (`nav.md`) with active link highlighting
- **Auto-generated table of contents** — builds an "On this page" section from headings (h2-h4)
- **Shared header / footer** — specify via `.md` file path in config
- **Hash routing** — optional `"routing": "hash"` mode for `file://` protocol compatibility
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
| `routing`         | Routing mode: `query` or `hash`                                                        | `query`          |
| `lobsterUrl`      | URL to lobster.js                                                                      | GitHub Pages CDN |

## Development

```bash
pnpm install
pnpm run build       # Build dist/lobster-wiki.js
pnpm run build:docs  # Build and copy to docs/ for GitHub Pages
```

## License

MIT
