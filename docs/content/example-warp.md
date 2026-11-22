# Warp / Multi-column

The **Warp** system lets you define content once and place it anywhere in the layout — including inside silent table cells for multi-column layouts.

## How Warp works

1. Define a warp block with `:::warp id`
2. Reference it anywhere with `[~id]`

```markdown
:::warp my-block
This content can be placed anywhere.
:::

See it here:

[~my-block]
```

The warp block renders nothing where it is defined; only the reference shows its content.

## Two-column layout

Combine a **silent table** with **warp references** to create a two-column layout:

```markdown
~ |          Left           |          Right          |
~ | :---                    | :---                    |
~ | [~col-left]             | [~col-right]            |

:::warp col-left
### Left column

Standard Markdown **works** inside warp blocks.

- Item A
- Item B
- Item C
:::

:::warp col-right
### Right column

You can put *any* content here — tables, code, images, even nested warp references.

> Blockquotes work too.
:::
```

**Result:**

~ |          Left           |          Right          |
~ | :---                    | :---                    |
~ | [~col-left]             | [~col-right]            |

:::warp col-left
### Left column

Standard Markdown **works** inside warp blocks.

- Item A
- Item B
- Item C
:::

:::warp col-right
### Right column

You can put *any* content here — tables, code, images, even nested warp references.

> Blockquotes work too.
:::

## Three-column layout

Silent tables support any number of columns:

```markdown
~ |                  |                 |                |
~ | :---             | :---            | :---           |
~ | [~c1]            | [~c2]           | [~c3]          |

:::warp c1
**Column 1**

Parse
:::

:::warp c2
**Column 2**

Render
:::

:::warp c3
**Column 3**

Display
:::
```

**Result:**

~ |  |  |  |
~ | :--- | :--- | :--- |
~ | [~c1] | [~c2] | [~c3] |

:::warp c1
**Column 1**

Parse
:::

:::warp c2
**Column 2**

Render
:::

:::warp c3
**Column 3**

Display
:::

## Warp across multiple files

When you load multiple files with `loadMarkdown`, warp definitions are shared across all files:

```js
loadMarkdown(["./shared.md", "./page.md"], container);
```

Define warps in `shared.md`, reference them in `page.md` — they resolve correctly because all files are merged before parsing.

## Key rules

- A `:::warp` block **must** have an id: `:::warp my-id`
- The `[~id]` reference can appear **before or after** the definition
- A `:::warp` block renders nothing where it is defined; only its references show its content
- A reference on its own line is replaced by the warp's blocks, and a reference in a table cell fills the cell
- Do not put a reference in the middle of a paragraph: the warp's blocks would end up inside the `<p>`, which is not valid HTML
- When the same id is defined more than once, the last definition wins
- A reference without a matching definition stays as plain text
