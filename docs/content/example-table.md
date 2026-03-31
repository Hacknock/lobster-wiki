# Tables

lobster.js supports standard Markdown tables plus two powerful extensions: **cell merging** and **silent tables** for layout grids.

## Standard table

```markdown
| Name       | Type    | Description                  |
| :--------- | :------ | :--------------------------- |
| `src`      | string  | Path or URL to Markdown file |
| `container`| Element | Target DOM element           |
| returns    | Promise | Resolves when rendered       |
```

**Result:**

| Name        | Type    | Description                  |
| :---------- | :------ | :--------------------------- |
| `src`       | string  | Path or URL to Markdown file |
| `container` | Element | Target DOM element           |
| returns     | Promise | Resolves when rendered       |

## Column alignment

Use `:---`, `:---:`, and `---:` in the separator row:

```markdown
| Left      | Center      | Right      |
| :-------- | :---------: | ---------: |
| apple     | banana      | cherry     |
| 1         | 2           | 3          |
```

**Result:**

| Left  | Center | Right  |
| :---- | :----: | -----: |
| apple | banana | cherry |
| 1     | 2      | 3      |

## Cell merging

### Horizontal merge

Append `\|` to a cell's content to extend it one column to the right. Works in **header rows** and **body rows** alike. The slot immediately after the `\|` cell is consumed by the merge:

```markdown
| Product | EMEA \|  | APAC \| |
| :------ | ---:  | ---: | ---:  | ---: |
|         | Q1    | Q2   | Q1    | Q2   |
| Alpha   | 100   | 120  | 80    | 90   |
| Beta    | 95    | 115  | 75    | 85   |
```

**Result:**

| Product | EMEA \|  | APAC \| |
| :------ | ---:  | ---: | ---:  | ---: |
|         | Q1    | Q2   | Q1    | Q2   |
| Alpha   | 100   | 120  | 80    | 90   |
| Beta    | 95    | 115  | 75    | 85   |

Body-row-only example:

```markdown
| Feature     | lobster.js | Standard MD |
| :---------- | :--------: | :---------: |
| Tables      | ✓          | ✓           |
| Cell merge  | ✓ only \|  |
| Warp blocks | ✓ only \|  |
```

**Result:**

| Feature     | lobster.js | Standard MD |
| :---------- | :--------: | :---------: |
| Tables      | ✓          | ✓           |
| Cell merge  | ✓ only \|  |
| Warp blocks | ✓ only \|  |

### Vertical merge

Write `\---` in a cell to merge it with the cell above:

```markdown
| Browser | Engine    |
| :------ | :-------- |
| Chrome  | Blink     |
| Edge    | \---      |
| Firefox | Gecko     |
| Safari  | WebKit    |
```

**Result:**

| Browser | Engine |
| :------ | :----- |
| Chrome  | Blink  |
| Edge    | \---   |
| Firefox | Gecko  |
| Safari  | WebKit |

### Combined merging

```markdown
| Region  | Q1     | Q2   |
| :------ | :---   | :--- |
| Europe  | 120    | 150  |
| \---    | 130 \| |
| Asia    | 200    | 180  |
```

**Result:**

| Region  | Q1     | Q2   |
| :------ | :---   | :--- |
| Europe  | 120    | 150  |
| \---    | 130 \| |
| Asia    | 200    | 180  |

## Silent table (layout grid)

Prefix each row with `~ ` to create a borderless layout grid. Great for side-by-side comparisons:

```markdown
~ | Left column           | Right column          |
~ | :---                  | :---                  |
~ | Content on the left.  | Content on the right. |
~ | More left content.    | More right content.   |
```

**Result:**

~ | Left column          | Right column          |
~ | :---                 | :---                  |
~ | Content on the left. | Content on the right. |
~ | More left content.   | More right content.   |

Silent tables are the building block for multi-column layouts with **Warp** — see the [Warp / Multi-column](?page=example-warp) page.
