import type { SelectedNode } from '../types';
import {
  ATTR_IDENTIFIER,
  ATTR_IDENTIFIER_EXTRA,
  ID_DIVISION,
} from './const';

/**
 * Check if a node is a highlight wrapper element
 */
export function isHighlightWrapNode($node: Node): boolean {
  if (!($node instanceof HTMLElement)) return false;
  return $node.hasAttribute(ATTR_IDENTIFIER);
}

/**
 * Find the ancestor wrapper element within root
 */
export function findAncestorWrapperInRoot(
  $node: Node,
  $root: HTMLElement
): HTMLElement | null {
  let current: Node | null = $node;

  while (current && current !== $root) {
    if (isHighlightWrapNode(current)) {
      return current as HTMLElement;
    }
    current = current.parentNode;
  }

  // Check if $root itself is a wrapper
  if (isHighlightWrapNode($root)) {
    return $root;
  }

  return null;
}

/**
 * Get highlight ID from a DOM node
 */
export function getHighlightId($node: Node, $root: HTMLElement): string {
  const $wrapper = findAncestorWrapperInRoot($node, $root);
  if (!$wrapper) return '';
  return $wrapper.getAttribute(ATTR_IDENTIFIER) || '';
}

/**
 * Get extra highlight IDs from a DOM node
 */
export function getExtraHighlightId($node: Node, $root: HTMLElement): string[] {
  const $wrapper = findAncestorWrapperInRoot($node, $root);
  if (!$wrapper) return [];

  const extraData = $wrapper.getAttribute(ATTR_IDENTIFIER_EXTRA);
  if (!extraData) return [];

  return extraData.split(ID_DIVISION).filter(Boolean);
}

/**
 * Get all highlight wrappers under root(s)
 */
export function getHighlightsByRoot(
  $roots: HTMLElement | HTMLElement[],
  wrapTag: string
): HTMLElement[] {
  const roots = Array.isArray($roots) ? $roots : [$roots];
  const result: HTMLElement[] = [];

  for (const $root of roots) {
    const wrappers = $root.querySelectorAll(`[${ATTR_IDENTIFIER}]`);
    result.push(...Array.from(wrappers as unknown as HTMLElement[]));
  }

  return result;
}

/**
 * Get highlight wrapper by ID
 */
export function getHighlightById(
  $root: HTMLElement,
  id: string,
  wrapTag: string
): HTMLElement | null {
  // First try to find by exact match
  const selector = `[${ATTR_IDENTIFIER}="${id}"]`;
  const $wrapper = $root.querySelector(selector);
  if ($wrapper) return $wrapper as HTMLElement;

  // Then search in extras
  const allWrappers = $root.querySelectorAll(`[${ATTR_IDENTIFIER_EXTRA}]`);
  for (const wrapper of allWrappers) {
    const extraIds = (wrapper.getAttribute(ATTR_IDENTIFIER_EXTRA) || '').split(ID_DIVISION);
    if (extraIds.includes(id)) {
      return wrapper as HTMLElement;
    }
  }

  return null;
}

/**
 * Get ALL highlight wrappers by ID (returns array for multi-element highlights)
 */
export function getHighlightsById(
  $root: HTMLElement,
  id: string,
  wrapTag: string
): HTMLElement[] {
  const result: HTMLElement[] = [];

  // Find all by exact match
  const selector = `[${ATTR_IDENTIFIER}="${id}"]`;
  const wrappers = $root.querySelectorAll(selector);
  result.push(...Array.from(wrappers as unknown as HTMLElement[]));

  // Then search in extras
  const allWrappers = $root.querySelectorAll(`[${ATTR_IDENTIFIER_EXTRA}]`);
  for (const wrapper of allWrappers) {
    const extraIds = (wrapper.getAttribute(ATTR_IDENTIFIER_EXTRA) || '').split(ID_DIVISION);
    if (extraIds.includes(id)) {
      result.push(wrapper as HTMLElement);
    }
  }

  return result;
}

/**
 * Add class(es) to an element
 */
export function addClass($el: HTMLElement, className: string | string[]): void {
  const classes = Array.isArray(className) ? className : className.split(/\s+/);
  $el.classList.add(...classes);
}

/**
 * Remove class(es) from an element
 */
export function removeClass(
  $el: HTMLElement,
  className: string | string[]
): void {
  const classes = Array.isArray(className) ? className : className.split(/\s+/);
  $el.classList.remove(...classes);
}

/**
 * Check if element has a class
 */
export function hasClass($el: HTMLElement, className: string): boolean {
  return $el.classList.contains(className);
}

/**
 * Normalize sibling text nodes (IE11 workaround)
 */
export function normalizeSiblingText($s: Node, isNext: boolean): void {
  const method = isNext ? 'nextSibling' : 'previousSibling';
  let $node = ($s as Node)[method] as Node | null;

  while ($node) {
    if ($node.nodeType === Node.TEXT_NODE) {
      const next = $node[method] as Node | null;
      if ($node.textContent === '') {
        $node.parentNode?.removeChild($node);
      } else {
        break;
      }
      $node = next;
    } else {
      break;
    }
  }
}

/**
 * Check if a text node is empty
 */
export function isTextNodeEmpty($node: Node): boolean {
  return $node.textContent === '';
}

/**
 * Get selected nodes within a range
 */
export function getSelectedNodes(
  $root: HTMLElement,
  start: { $node: Node; offset: number },
  end: { $node: Node; offset: number },
  exceptSelectors: string[] | null = null
): SelectedNode[] {
  const result: SelectedNode[] = [];

  // Same node case
  if (start.$node === end.$node) {
    return [
      {
        $node: start.$node,
        type: 'text',
        splitType: 'both',
      },
    ];
  }

  // Collect nodes between start and end
  const visited = new Set<Node>();
  let current = start.$node;

  // Move to next text node after start
  const getNextTextNode = (node: Node): Text | null => {
    let n: Node | null = node;
    while (n && n !== end.$node) {
      if (n.nodeType === Node.TEXT_NODE) {
        return n as Text;
      }
      n = n.nextSibling;
    }
    return null;
  };

  // Handle start node
  if (start.$node.nodeType === Node.TEXT_NODE) {
    result.push({
      $node: start.$node,
      type: 'text',
      splitType: 'head',
    });
  }

  // Get middle nodes
  let nextText = getNextTextNode(start.$node);
  while (nextText && nextText !== end.$node) {
    if (!visited.has(nextText)) {
      result.push({
        $node: nextText,
        type: 'text',
        splitType: 'none',
      });
      visited.add(nextText);
    }
    const next = nextText.nextSibling;
    nextText = next && next.nodeType === Node.TEXT_NODE ? (next as Text) : getNextTextNode(next!);
  }

  // Handle end node
  if (end.$node.nodeType === Node.TEXT_NODE) {
    result.push({
      $node: end.$node,
      type: 'text',
      splitType: 'tail',
    });
  }

  return result;
}
