/**
 * web-highlighter-plus Type Definitions
 */

// ==================== Core Data Structures ====================

/**
 * DOM node with offset - represents a position in the DOM tree
 */
export interface DomNode {
  $node: Node;
  offset: number;
}

/**
 * Serializable DOM metadata for persistence
 * Used to reconstruct positions after page reload
 */
export interface DomMeta {
  /** Parent element tag name (e.g., 'DIV', 'P') */
  parentTagName: string;
  /** Index among siblings with the same tag name */
  parentIndex: number;
  /** Character offset within the parent's text content */
  textOffset: number;
  /** Optional extra data (e.g., from hooks) */
  extra?: unknown;
}

/**
 * Serializable highlight source data
 * Can be JSON serialized and stored in backend
 */
export interface Source {
  /** Unique identifier for the highlight */
  id: string;
  /** Highlighted text content */
  text: string;
  /** Start position metadata */
  startMeta: DomMeta;
  /** End position metadata */
  endMeta: DomMeta;
  /** Optional extra data */
  extra?: unknown;
}

/**
 * Runtime highlight range (not serializable)
 */
export interface RangeData {
  /** Start node and offset */
  start: DomNode;
  /** End node and offset */
  end: DomNode;
  /** Selected text content */
  text: string;
  /** Unique identifier */
  id: string;
  /** Whether the range is frozen for rendering */
  frozen: boolean;
}

/**
 * Represents a text node selected for highlighting
 */
export interface SelectedNode {
  /** The actual DOM node */
  $node: Node | Text;
  /** Node type: 'text' for Text node, 'span' for wrapper */
  type: 'text' | 'span';
  /**
   * Split type indicates how the node was split:
   * - 'none': Node not split, fully selected
   * - 'head': Left portion selected (split at end)
   * - 'tail': Right portion selected (split at start)
   * - 'both': Middle portion selected (split at both ends)
   */
  splitType: 'none' | 'head' | 'tail' | 'both';
}

// ==================== Configuration ====================

/**
 * Constructor options for HighlighterPlus
 */
export interface Options {
  /** Root container element for highlighting (default: document.body) */
  root?: HTMLElement | Document;
  /** HTML tag used to wrap highlighted text (default: 'span') */
  wrapTag?: string;
  /** Default CSS class name for wrappers (default: 'highlight-wrap') */
  className?: string | string[];
  /** Elements matching these selectors will be excluded from highlighting */
  exceptSelectors?: string[] | null;
  /** Enable verbose logging */
  verbose?: boolean;
}

// ==================== Internal Types ====================

/**
 * Wrapper element data stored in cache
 */
export interface WrapperData {
  id: string;
  extraIds: string[];
  className: string;
}

// ==================== Constants ====================

export const DATASET_ID = 'highlight-id' as const;
export const DATASET_ID_EXTRA = 'highlight-id-extra' as const;
export const DATASET_SPLIT_TYPE = 'highlight-split-type' as const;

export const ROOT_IDX = -2;
export const UNKNOWN_IDX = -1;

export const DEFAULT_WRAP_TAG = 'span';
export const DEFAULT_CLASS_NAME = 'highlight-wrap';
