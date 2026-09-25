---
title: A placeholder post title that runs a little long
description: One sentence on what this post covers and who it's for.
date: 2026-09-24
tags: [CSS, Design systems]
draft: true
---

This is sample copy for the Rivendell prose styles. It exists so every long-form element can be checked in both modes and every theme. Links look [like this](#), and `inline code` sits on the surface color.

## A section heading

Paragraph rhythm matters more than any single style. Short paragraphs, generous line height, and a comfortable measure keep long reads easy.

### A smaller heading

- An unordered list item
- Another item with a bit more text so it wraps onto a second line on narrow screens
- A third item

1. An ordered step
2. A second step

> A blockquote for when someone else said it better. It uses the Quote typography with an accent rule.

```ts
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230)); // minutes
}
```

#### A fourth-level heading

| Token | Light | Dark |
| --- | --- | --- |
| `--rvd-accent` | 0.53 | 0.74 |
| `--rvd-accent-text` | 0.48 | 0.74 |

---

A closing paragraph after a rule.
