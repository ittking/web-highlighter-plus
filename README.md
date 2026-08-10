# web-highlighter-plus

A modern TypeScript library for text highlighting and serialization. Based on native DOM APIs, providing Range serialization, cross-tag rendering, and batch restoration. Zero runtime dependencies.

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

## Project Structure

```
web-highlighter-plus/
├── src/
│   ├── core/
│   │   ├── Highlighter.tsx   # Core class, public API
│   │   ├── Painter.ts        # DOM renderer, wraps text nodes
│   │   └── Serializer.ts     # Serializer/deserializer
│   ├── model/
│   │   ├── Range.ts          # HighlightRange data structure
│   │   └── Source.ts         # HighlightSource data structure
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── const.ts          # Constants
│   │   ├── dom.ts            # DOM utilities
│   │   └── uuid.ts           # UUID generation
│   └── index.ts              # Entry point
├── index.html                # Demo page
├── dist/                     # Build output
└── package.json
```

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
# Production build
pnpm build

# Preview production build
pnpm preview
```

Build output is in the `dist/` directory.

## Quick Start

### Initialization

```typescript
import { HighlighterPlus } from 'web-highlighter-plus';

const hp = new HighlighterPlus({
  root: document.getElementById('content'),  // Root container
  wrapTag: 'span',                           // Wrapper tag, default 'span'
  className: 'highlight-wrap',               // Default class name
  exceptSelectors: ['code', 'pre', 'a'],     // Elements to exclude from highlighting
  verbose: true,                             // Debug logging
});
```

### F1: Serialize Selection

Convert user-selected text to a storable data structure:

```typescript
// Serialize from Range object
const source = hp.fromRange(range);
if (source) {
  // source.id        - Unique ID (UUID)
  // source.text      - Selected text content
  // source.startMeta - Start position metadata
  // source.endMeta   - End position metadata
  console.log(source);
}

// Serialize from current window.getSelection()
const source2 = hp.fromSelection();
```

### F2: Render Source to DOM

Render Source objects into multiple span wrapper elements:

```typescript
// Render single Source
const doms = hp.render(source);
console.log(`Rendered ${doms.length} elements`);

// Batch render
const domsAll = hp.renderAll([source1, source2, source3]);
```

### F3: Class Style Control

Add or remove CSS classes from highlights:

```typescript
// Add custom class
hp.addClass(source.id, 'custom-highlight');

// Remove custom class
hp.removeClass(source.id, 'custom-highlight');
```

### F4: Batch Restoration

Restore highlights from stored data:

```typescript
// Get data from localStorage or server
const storedSources = JSON.parse(localStorage.getItem('highlights') || '[]');

// Batch restore
hp.restore(storedSources);
```

### F5: Clear Function

```typescript
// Remove single highlight
hp.remove(source.id);

// Remove all highlights
hp.removeAll();
```

## API Reference

### Constructor Options

```typescript
interface Options {
  root?: HTMLElement | Document;    // Root container, default document.body
  wrapTag?: string;                 // Wrapper tag, default 'span'
  className?: string | string[];    // Default class name
  exceptSelectors?: string[] | null; // Elements to exclude from highlighting
  verbose?: boolean;                // Enable debug logging
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
| `restore(sources)` | `HTMLElement[]` | Batch restore (alias for renderAll) |
| `remove(id)` | `void` | Remove single highlight |
| `removeAll()` | `void` | Remove all highlights |
| `addClass(id, className)` | `void` | Add CSS class |
| `removeClass(id, className)` | `void` | Remove CSS class |

### Utility Methods

| Method | Return | Description |
|--------|--------|-------------|
| `getDoms(id?)` | `HTMLElement[]` | Get wrapper elements, all if no id provided |
| `getIdByDom(dom)` | `string` | Get highlight ID from DOM node |
| `getSources()` | `Source[]` | Get all serialized Sources |
| `getSource(id)` | `Source \| undefined` | Get Source by ID |

### Data Structures

#### Source

JSON-serializable data structure for storage:

```typescript
interface Source {
  id: string;           // UUID
  text: string;         // Text content
  startMeta: DomMeta;   // Start position
  endMeta: DomMeta;     // End position
  extra?: unknown;      // Extra data
}
```

#### DomMeta

Describes precise position in DOM:

```typescript
interface DomMeta {
  parentTagName: string;  // Parent element tag name, e.g. 'P', 'DIV', 'STRONG'
  parentIndex: number;    // Index among siblings with the same tag
  textOffset: number;     // Character offset within parent's text
}
```

#### SelectedNode

Intermediate data structure used during rendering:

```typescript
interface SelectedNode {
  $node: Node | Text;     // DOM node
  type: 'text' | 'span';  // Node type
  splitType: 'none' | 'head' | 'tail' | 'both';  // Split type
}
```

## Core Concepts

### Cross-tag Rendering

When user selection spans multiple HTML tags (e.g., `<strong>bold</strong>and<em>italic</em>`), the renderer:

1. Splits text within each tag into independent text nodes
2. Creates independent span wrapper elements for each text node
3. All spans use the same `data-highlight-id`

### exceptSelectors

`exceptSelectors` specifies which elements are excluded from highlighting:

```typescript
const hp = new HighlighterPlus({
  exceptSelectors: ['code', 'pre', 'a', '.no-highlight'],
});
```

When selection passes through these elements, the text inside them will not be highlighted.

### Overlapping Highlights

When a new highlight overlaps with an existing one:

1. **Complete overlap**: Record extra ID in `data-highlight-id-extra`
2. **Partial overlap**: Split existing wrapper element
3. Removal correctly handles ID transfer logic

## Exports

```typescript
// Main class
export { HighlighterPlus };

// Data models
export { HighlightSource, HighlightRange };

// Types
export type { Source, DomMeta, DomNode, Options, RangeData, SelectedNode };

// Constants
export {
  ATTR_IDENTIFIER,        // 'data-highlight-id'
  ATTR_IDENTIFIER_EXTRA,  // 'data-highlight-id-extra'
  ATTR_SPLIT_TYPE,        // 'data-highlight-split-type'
  ROOT_IDX,               // -2
  UNKNOWN_IDX,            // -1
  DEFAULT_WRAP_TAG,       // 'span'
  DEFAULT_CLASS_NAME,     // 'highlight-wrap'
  ID_DIVISION,            // ';'
};

// Utilities
export { createUUID };
```

## Build

This project uses Vite for building with zero runtime dependencies.

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Production build
pnpm build

# Preview build result
pnpm preview
```

Build artifacts support:
- ESM module (`dist/index.js`)
- TypeScript types inlined

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge latest)
- Requires native DOM API support: `Node.TEXT_NODE`, `TreeWalker`, `splitText()`, etc.

## License

MIT

## GitHub

https://github.com/ittking/web-highlighter-plus
