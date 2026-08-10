import type { DomNode, RangeData } from '../types';
import { createUUID } from '../utils/uuid';

/**
 * HighlightRange - Runtime representation of a highlight selection
 * Not serializable, used during rendering
 */
export class HighlightRange implements RangeData {
  start: DomNode;
  end: DomNode;
  text: string;
  id: string;
  frozen: boolean = false;

  constructor(start: DomNode, end: DomNode, text: string, id: string) {
    this.start = start;
    this.end = end;
    this.text = text;
    this.id = id;
  }

  /**
   * Create a HighlightRange from a native Range object
   */
  static fromRange(range: Range, id?: string): HighlightRange | null {
    const startNode = range.startContainer;
    const endNode = range.endContainer;

    // Validate that we're working with text nodes
    if (
      startNode.nodeType !== Node.TEXT_NODE ||
      endNode.nodeType !== Node.TEXT_NODE
    ) {
      console.warn('web-highlighter-plus: Only text nodes can be highlighted');
      return null;
    }

    const idGenerated = id || createUUID();
    const text = range.toString();

    return new HighlightRange(
      { $node: startNode, offset: range.startOffset },
      { $node: endNode, offset: range.endOffset },
      text,
      idGenerated
    );
  }

  /**
   * Create a HighlightRange from a window selection
   */
  static fromSelection(id?: string): HighlightRange | null {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    return HighlightRange.fromRange(range, id);
  }

  /**
   * Freeze the range before rendering
   */
  freeze(): void {
    this.frozen = true;
  }

  /**
   * Clear the browser selection
   */
  static removeDomRange(): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }
}
