import type { DomNode, SelectedNode, Source } from '../types';
import { Serializer } from './Serializer';
import {
  DATASET_IDENTIFIER,
  DATASET_IDENTIFIER_EXTRA,
  DATASET_SPLIT_TYPE,
  ATTR_IDENTIFIER,
  ATTR_IDENTIFIER_EXTRA,
  ATTR_SPLIT_TYPE,
  ID_DIVISION,
} from '../utils/const';
import {
  isHighlightWrapNode,
  getHighlightById,
  getHighlightsById,
  addClass,
  removeClass,
  normalizeSiblingText,
} from '../utils/dom';

/**
 * Painter - Handles DOM rendering of highlights
 * Core logic for wrapping text nodes with span elements
 * Based on web-highlighter's implementation
 */
export class Painter {
  private $root: HTMLElement;
  private wrapTag: string;
  private className: string;
  private exceptSelectors: string[] | null;

  constructor(
    $root: HTMLElement,
    wrapTag: string,
    className: string,
    exceptSelectors: string[] | null = null
  ) {
    this.$root = $root;
    this.wrapTag = wrapTag;
    this.className = className;
    this.exceptSelectors = exceptSelectors;
  }

  /**
   * Render a Source to DOM
   */
  highlightSource(source: Source): HTMLElement[] {
    // Deserialize to DOM positions
    const positions = Serializer.deserialize(source, this.$root);
    if (!positions) return [];

    return this.highlightRange(
      positions.start,
      positions.end,
      source.id,
      source.text
    );
  }

  /**
   * Render multiple sources
   */
  highlightSources(sources: Source[]): HTMLElement[] {
    const allDoms: HTMLElement[] = [];
    for (const source of sources) {
      const doms = this.highlightSource(source);
      allDoms.push(...doms);
    }
    return allDoms;
  }

  /**
   * Render a range to DOM
   */
  highlightRange(
    start: DomNode,
    end: DomNode,
    id: string,
    text: string
  ): HTMLElement[] {
    // Get selected nodes using the same logic as web-highlighter
    const selectedNodes = Serializer.getSelectedNodes(
      this.$root,
      start,
      end,
      this.exceptSelectors
    );

    if (selectedNodes.length === 0) return [];

    // Wrap each node
    const wrappers: HTMLElement[] = [];

    for (const selected of selectedNodes) {
      const $wrapper = this.wrapNode(selected, id);
      if ($wrapper) {
        wrappers.push($wrapper);
      }
    }

    return wrappers;
  }

  /**
   * Wrap a selected node with a highlight span
   * Based on web-highlighter's wrapHighlight logic
   */
  private wrapNode(selected: SelectedNode, id: string): HTMLElement | null {
    const { $node, splitType } = selected;

    if (!($node instanceof Text)) return null;

    const $text = $node;
    const $parent = $text.parentElement;
    if (!$parent) return null;

    // Check if already wrapped
    if (isHighlightWrapNode($parent)) {
      return this.wrapOverlapNode($parent, $text, splitType, id);
    }

    // Not wrapped yet - wrap as new node
    return this.wrapNewNode($text, splitType, id);
  }

  /**
   * Wrap a new (unwrapped) text node
   */
  private wrapNewNode($text: Text, splitType: 'none' | 'head' | 'tail' | 'both', id: string): HTMLElement {
    const $wrap = document.createElement(this.wrapTag);

    // Set data attributes
    $wrap.setAttribute(ATTR_IDENTIFIER, id);
    $wrap.setAttribute(ATTR_SPLIT_TYPE, splitType);
    $wrap.setAttribute(ATTR_IDENTIFIER_EXTRA, '');

    // Add classes
    if (this.className) {
      const classes = Array.isArray(this.className)
        ? this.className
        : this.className.split(/\s+/);
      $wrap.classList.add(...classes);
    }

    // Replace the text node with the wrapper
    $text.parentNode?.replaceChild($wrap, $text);
    $wrap.appendChild($text);

    return $wrap;
  }

  /**
   * Wrap when node is already inside a highlight wrapper (overlap handling)
   */
  private wrapOverlapNode(
    $existingWrapper: HTMLElement,
    $text: Text,
    splitType: 'none' | 'head' | 'tail' | 'both',
    newId: string
  ): HTMLElement {
    const existingId = $existingWrapper.getAttribute(ATTR_IDENTIFIER) || '';
    const existingExtra =
      ($existingWrapper.getAttribute(ATTR_IDENTIFIER_EXTRA) || '').split(ID_DIVISION).filter(Boolean);

    // Add new ID to extra if different
    if (newId !== existingId && !existingExtra.includes(newId)) {
      existingExtra.push(newId);
      $existingWrapper.setAttribute(ATTR_IDENTIFIER_EXTRA, existingExtra.join(ID_DIVISION));
    }

    return $existingWrapper;
  }

  /**
   * Remove a highlight by ID
   */
  removeHighlight(id: string): boolean {
    const $wrappers = getHighlightsById(this.$root, id, this.wrapTag);
    if ($wrappers.length === 0) return false;

    for (const $wrapper of $wrappers) {
      const extraIds =
        ($wrapper.getAttribute(ATTR_IDENTIFIER_EXTRA) || '').split(ID_DIVISION).filter(Boolean);

      if (extraIds.length === 0) {
        // No overlap - remove completely
        this.unwrapWrapper($wrapper);
      } else {
        // Has overlap - update IDs
        const idx = extraIds.indexOf(id);
        if (idx !== -1) {
          extraIds.splice(idx, 1);
        }

        if (extraIds.length > 0) {
          // Transfer first extra to main
          $wrapper.setAttribute(ATTR_IDENTIFIER, extraIds[0]);
          extraIds.shift();
          $wrapper.setAttribute(ATTR_IDENTIFIER_EXTRA, extraIds.join(ID_DIVISION));
        } else {
          $wrapper.removeAttribute(ATTR_IDENTIFIER_EXTRA);
        }
      }
    }

    return true;
  }

  /**
   * Remove all highlights
   */
  removeAllHighlights(): void {
    const wrappers = this.$root.querySelectorAll(
      `[${DATASET_IDENTIFIER}]`
    ) as NodeListOf<HTMLElement>;

    wrappers.forEach(($wrapper) => {
      this.unwrapWrapper($wrapper);
    });
  }

  /**
   * Unwrap a highlight wrapper, preserving content
   */
  private unwrapWrapper($wrapper: HTMLElement): void {
    const parent = $wrapper.parentNode;
    if (!parent) return;

    // Move all children out
    while ($wrapper.firstChild) {
      parent.insertBefore($wrapper.firstChild, $wrapper);
    }

    parent.removeChild($wrapper);

    // Normalize adjacent text nodes
    if ($wrapper.previousSibling?.nodeType === Node.TEXT_NODE) {
      normalizeSiblingText($wrapper.previousSibling as Text, true);
    }
    if ($wrapper.nextSibling?.nodeType === Node.TEXT_NODE) {
      normalizeSiblingText($wrapper.nextSibling as Text, false);
    }
  }

  /**
   * Add class to highlight wrapper(s)
   */
  addClassToHighlight(id: string, className: string): void {
    const $wrappers = getHighlightsById(this.$root, id, this.wrapTag);
    for (const $wrapper of $wrappers) {
      addClass($wrapper, className);
    }
  }

  /**
   * Remove class from highlight wrapper(s)
   */
  removeClassFromHighlight(id: string, className: string): void {
    const $wrappers = getHighlightsById(this.$root, id, this.wrapTag);
    for (const $wrapper of $wrappers) {
      removeClass($wrapper, className);
    }
  }

  /**
   * Get all wrapper elements
   */
  getDoms(id?: string): HTMLElement[] {
    if (id) {
      const $wrapper = getHighlightById(this.$root, id, this.wrapTag);
      return $wrapper ? [$wrapper] : [];
    }

    return Array.from(
      this.$root.querySelectorAll(`[${ATTR_IDENTIFIER}]`)
    ) as HTMLElement[];
  }

  /**
   * Get highlight ID from a DOM node
   */
  getIdByDom($node: Node): string {
    const $wrapper = this.$root.querySelector(
      `[${ATTR_IDENTIFIER}="${$node}"]`
    );
    if ($wrapper) {
      return $wrapper.getAttribute(ATTR_IDENTIFIER) || '';
    }

    // Search in extras
    const allWrappers = this.$root.querySelectorAll(
      `[${ATTR_IDENTIFIER_EXTRA}]`
    );
    for (const wrapper of allWrappers) {
      const extras = (wrapper.getAttribute(ATTR_IDENTIFIER_EXTRA) || '').split(ID_DIVISION);
      if (extras.includes($node.textContent || '')) {
        return wrapper.getAttribute(ATTR_IDENTIFIER) || '';
      }
    }

    return '';
  }
}
