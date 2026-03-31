# Images

lobster.js supports standard Markdown image syntax plus an **optional size specifier** `=WxH` that maps directly to `width` / `height` attributes — no CSS required.

## Basic image

```markdown
![Sample wide image](../images/sample-wide.png)
```

**Result:**

![Sample wide image](../images/sample-wide.png)

---

## Image sizing

Append `=WxH` (in pixels) to the URL inside the parentheses. Either dimension can be omitted.

### Width only — `=400x`

Scales the image to 400 px wide; height is proportional.

```markdown
![Sample =400x](../images/sample-wide.png =400x)
```

![Sample =400x](../images/sample-wide.png =400x)

### Width only — `=200x`

```markdown
![Sample =200x](../images/sample-wide.png =200x)
```

![Sample =200x](../images/sample-wide.png =200x)

### Explicit width × height — `=300x150`

```markdown
![Sample =300x150](../images/sample-wide.png =300x150)
```

![Sample =300x150](../images/sample-wide.png =300x150)

### Thumbnail — `=80x80`

```markdown
![Thumb](../images/sample-square.png =80x80)
![Thumb](../images/sample-square.png =80x80)
![Thumb](../images/sample-square.png =80x80)
```

![Thumb](../images/sample-square.png =80x80)
![Thumb](../images/sample-square.png =80x80)
![Thumb](../images/sample-square.png =80x80)

---

## Image + text layout

Combine a **silent table** with **warp blocks** to place an image beside text.

```markdown
~ |                     |                         |
~ | :---                | :---                    |
~ | [~img-col]          | [~text-col]             |

:::warp img-col
![Photo](../images/sample-square.png =240x)
:::

:::warp text-col
### Caption goes here

Use a **silent table** (`~ | … |`) as a borderless grid and **warp blocks**
to define column content independently from the layout declaration.

This pattern works for any combination — image left, image right,
or multiple columns of mixed content.
:::
```

**Result:**

~ |  |  |
~ | :--- | :--- |
~ | [~img-col] | [~text-col] |

:::warp img-col
![Photo](../images/sample-square.png =240x)
:::

:::warp text-col
### Caption goes here

Use a **silent table** (`~ | … |`) as a borderless grid and **warp blocks**
to define column content independently from the layout declaration.

This pattern works for any combination — image left, image right,
or multiple columns of mixed content.
:::

---

## Image grid

Three images in a 3-column silent table:

```markdown
~ |             |             |             |
~ | :---        | :---        | :---        |
~ | [~g1]       | [~g2]       | [~g3]       |

:::warp g1
![Grid 1](../images/sample-square.png =180x)
:::

:::warp g2
![Grid 2](../images/sample-square.png =180x)
:::

:::warp g3
![Grid 3](../images/sample-square.png =180x)
:::
```

**Result:**

~ |  |  |  |
~ | :--- | :--- | :--- |
~ | [~g1] | [~g2] | [~g3] |

:::warp g1
![Grid 1](../images/sample-square.png =180x)
:::

:::warp g2
![Grid 2](../images/sample-square.png =180x)
:::

:::warp g3
![Grid 3](../images/sample-square.png =180x)
:::

---

## HTML output

The size specifier maps to standard HTML attributes:

```html
<!-- ![alt](url =400x) -->
<img class="lbs-image" src="url" alt="alt" width="400">

<!-- ![alt](url =300x150) -->
<img class="lbs-image" src="url" alt="alt" width="300" height="150">
```

Style images via the `.lbs-image` class — for example `max-width: 100%` to make them responsive.
