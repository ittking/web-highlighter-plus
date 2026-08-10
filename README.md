# web-highlighter-plus

![web-highlighter-plus](https://raw.githubusercontent.com/alienzhou/web-highlighter/master/docs/img/logo.png)

> English | [中文](./README.zh-CN.md)

## Background

Originally, there was an open-source library [web-highlighter](https://github.com/alienzhou/web-highlighter) that provided text highlighting and serialization functionality. However, after using it in production, I encountered several issues:

- **Functional gaps** — Cross-tag rendering was incomplete, lacking proper support for overlapping highlights and batch restoration
- **Bugs** — Offset calculation errors when text spans nested elements, issues with same-node text splitting
- **Inflexibility** — Architecture was difficult to extend or customize for specific use cases

Since the original project had limited maintenance and couldn't meet my requirements, I decided to create a modern reimplementation from scratch, referencing the original's architecture while fixing its deficiencies.

**web-highlighter-plus** is a complete rewrite with:
- Cleaner, more maintainable code structure
- Fixed offset calculation algorithms
- Better TypeScript type safety
- More flexible API design

---

## Features

| Feature | Description |
|---------|-------------|
| **F1 Serialization** | Convert browser Range objects to JSON-serializable Source data structures |
| **F2 Cross-tag Rendering** | Correctly render selections spanning multiple HTML tags (like `<strong>`, `<em>`) into independent span elements |
| **F3 Class Control** | Add/remove CSS classes to all span wrapper elements with the specified ID |
| **F4 Batch Restoration** | Restore highlights from locally stored or server-side data |
| **F5 Clear Function** | Remove single highlight or all highlights |

## Tech Stack

- **TypeScript + TSX** - Type-safe, modern syntax
- **Vite** - Fast development and building
- **pnpm** - Efficient package management

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Visit http://localhost:3000 to see the interactive demo page.

## Build

```bash
# Build npm package
pnpm build

# Build demo page for GitHub Pages
pnpm build:demo
```

## Quick Start

```typescript
import { HighlighterPlus } from 'web-highlighter-plus';

const hp = new HighlighterPlus({
  root: document.getElementById('content'),
  wrapTag: 'span',
  className: 'highlight-wrap',
  exceptSelectors: ['code', 'pre', 'a'],
});

// Serialize selection
const source = hp.fromRange(range);

// Render to DOM
hp.render(source);

// Add class
hp.addClass(source.id, 'custom-highlight');

// Restore from storage
hp.restore(storedSources);

// Remove
hp.remove(source.id);
```

## API Reference

### Constructor Options

```typescript
interface Options {
  root?: HTMLElement | Document;
  wrapTag?: string;
  className?: string | string[];
  exceptSelectors?: string[] | null;
  verbose?: boolean;
}
```

### Core Methods

| Method | Return | Description |
|--------|--------|-------------|
| `fromRange(range)` | `Source \| null` | Serialize from Range object |
| `fromSelection()` | `Source \| null` | Serialize from current selection |
| `fromStore(...)` | `Source \| null` | Create Source from stored data |
| `render(source)` | `HTMLElement[]` | Render Source to DOM |
| `renderAll(sources)` | `HTMLElement[]` | Batch render |
| `restore(sources)` | `HTMLElement[]` | Batch restore |
| `remove(id)` | `void` | Remove single highlight |
| `removeAll()` | `void` | Remove all highlights |
| `addClass(id, className)` | `void` | Add CSS class |
| `removeClass(id, className)` | `void` | Remove CSS class |

### Data Structures

#### Source

```typescript
interface Source {
  id: string;
  text: string;
  startMeta: DomMeta;
  endMeta: DomMeta;
  extra?: unknown;
}
```

#### DomMeta

```typescript
interface DomMeta {
  parentTagName: string;
  parentIndex: number;
  textOffset: number;
}
```

## License

MIT

## GitHub

https://github.com/ittking/web-highlighter-plus
