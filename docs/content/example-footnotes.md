# Footnotes

lobster.js supports two footnote styles: **reference footnotes** defined separately, and **inline footnotes** written right in the text.

## Reference footnotes

Add `[^id]` in the text and define the note anywhere in the document with `[^id]: …`:

```markdown
Lobster[^1] is both a crustacean and a Markdown parser[^parser].

[^1]: The crustacean kind has ten legs and lives in the ocean.
[^parser]: The parser kind has zero legs and lives in your browser.
```

**Result:**

Lobster[^1] is both a crustacean and a Markdown parser[^parser].

[^1]: The crustacean kind has ten legs and lives in the ocean.
[^parser]: The parser kind has zero legs and lives in your browser.

Footnote definitions are collected and rendered at the bottom of the page as a numbered list.

## Inline footnotes

Use `^[…]` to write the note content directly in the text — no separate definition needed:

```markdown
The CDN URL^[https://hacknock.github.io/lobsterjs/lobster.js] is always up to date.

lobster.js^[Named after the crustacean — both are ancient, armored, and unexpectedly useful.] is CSS-first.
```

**Result:**

The CDN URL^[https://hacknock.github.io/lobsterjs/lobster.js] is always up to date.

lobster.js^[Named after the crustacean — both are ancient, armored, and unexpectedly useful.] is CSS-first.

## Mixing both styles

You can freely mix reference and inline footnotes on the same page:

```markdown
Use `loadMarkdown`[^api] to render content^[Rendered into any HTMLElement you provide.].

[^api]: See the Introduction page for the full API reference.
```

**Result:**

Use `loadMarkdown`[^api] to render content^[Rendered into any HTMLElement you provide.].

[^api]: See the Introduction page for the full API reference.

## Footnote rendering

All footnotes — reference and inline — are collected and rendered at the bottom of the page inside a `.lbs-footnotes` container:

```html
<section class="lbs-footnotes">
  <ol>
    <li class="lbs-footnote-item" id="fn-1">…</li>
  </ol>
</section>
```

The superscript reference links (`[1]`) are wrapped in `.lbs-footnote-ref` and link down to the footnote item.
