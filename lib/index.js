/**
 * web-highlighter-plus
 *
 * A modern TypeScript library for text highlighting and serialization.
 * Provides Range-to-Source serialization, cross-tag rendering, and highlight management.
 *
 * @example
 * import { HighlighterPlus } from 'web-highlighter-plus';
 *
 * const hp = new HighlighterPlus({ root: document.getElementById('content') });
 *
 * // Serialize selected text
 * const source = hp.fromRange(range);
 *
 * // Render to DOM
 * hp.render(source);
 *
 * // Add class
 * hp.addClass(source.id, 'my-highlight');
 */
// Main class
export { HighlighterPlus } from './core/Highlighter';
// Model classes
export { HighlightSource } from './model/Source';
export { HighlightRange } from './model/Range';
// Constants
export { ATTR_IDENTIFIER, ATTR_IDENTIFIER_EXTRA, ATTR_SPLIT_TYPE, ROOT_IDX, UNKNOWN_IDX, DEFAULT_WRAP_TAG, DEFAULT_CLASS_NAME, ID_DIVISION, } from './utils/const';
// Utilities
export { createUUID } from './utils/uuid';
