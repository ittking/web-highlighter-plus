import type { DomMeta, DomNode, SelectedNode, Source } from '../types';
import { ROOT_IDX, UNKNOWN_IDX } from '../utils/const';

/**
 * Serializer - Handles DOM <-> Meta conversion
 * Core logic for serialization and deserialization
 * Based on web-highlighter's implementation
 */
export class Serializer {
  /**
   * Get text total length in all predecessors (text nodes) in the root node
   * (without offset in current node)
   */
  private static getTextPreOffset($root: Node, $text: Node): number {
    const nodeStack: Node[] = [$root];

    let $curNode: Node | undefined;
    let offset = 0;

    while (($curNode = nodeStack.pop()) !== undefined) {
      const children = $curNode.childNodes;

      for (let i = children.length - 1; i >= 0; i--) {
        nodeStack.push(children[i]);
      }

      if ($curNode.nodeType === Node.TEXT_NODE && $curNode !== $text) {
        offset += ($curNode as Text).textContent?.length || 0;
      } else if ($curNode.nodeType === Node.TEXT_NODE) {
        break;
      }
    }

    return offset;
  }

  /**
   * Find the original dom parent node (not a highlight wrapper)
   */
  private static getOriginParent($node: HTMLElement | Text): HTMLElement {
    if ($node instanceof HTMLElement && !$node.hasAttribute('data-highlight-id')) {
      return $node;
    }

    let $originParent = $node.parentNode as HTMLElement;

    while ($originParent?.hasAttribute('data-highlight-id')) {
      $originParent = $originParent.parentNode as HTMLElement;
    }

    return $originParent;
  }

  /**
   * Calculate DOM metadata from a text node + offset
   * Returns parentTagName, parentIndex, and textOffset (cumulative offset from root)
   */
  static getDomMeta(
    $node: HTMLElement | Text,
    offset: number,
    $root: HTMLElement
  ): DomMeta {
    const $originParent = this.getOriginParent($node);
    const index = $originParent === $root ? ROOT_IDX : this.countGlobalNodeIndex($originParent, $root);
    const preNodeOffset = this.getTextPreOffset($originParent, $node);
    const tagName = $originParent.tagName;

    return {
      parentTagName: tagName,
      parentIndex: index,
      textOffset: preNodeOffset + offset,
    };
  }

  /**
   * Count the index of a node among its siblings with the same tag
   */
  private static countGlobalNodeIndex($node: Node, $root: Document | HTMLElement): number {
    const tagName = ($node as HTMLElement).tagName;
    const $list = ($root as HTMLElement).getElementsByTagName(tagName);

    for (let i = 0; i < $list.length; i++) {
      if ($node === $list[i]) {
        return i;
      }
    }

    return UNKNOWN_IDX;
  }

  /**
   * Find parent element by metadata
   */
  private static findParentByMeta(
    meta: DomMeta,
    $root: HTMLElement
  ): HTMLElement | null {
    const { parentTagName, parentIndex } = meta;

    if (parentIndex === ROOT_IDX) {
      return $root;
    }

    const $list = $root.getElementsByTagName(parentTagName);

    if (parentIndex < $list.length) {
      return $list[parentIndex] as HTMLElement;
    }

    return null;
  }

  /**
   * Find text node and offset by cumulative text offset
   * Uses stack-based traversal to find the text node at the given offset
   */
  static getTextNodeByOffset($parent: Node, offset: number): DomNode {
    const nodeStack: Node[] = [$parent];

    let $curNode: Node | undefined;
    let curOffset = 0;
    let startOffset = 0;

    while (($curNode = nodeStack.pop()) !== undefined) {
      const children = $curNode.childNodes;

      // Push children in reverse order so we process them in order
      for (let i = children.length - 1; i >= 0; i--) {
        nodeStack.push(children[i]);
      }

      if ($curNode.nodeType === Node.TEXT_NODE) {
        startOffset = offset - curOffset;
        curOffset += ($curNode as Text).textContent?.length || 0;

        if (curOffset >= offset) {
          return {
            $node: $curNode,
            offset: startOffset,
          };
        }
      }
    }

    // Fallback: return parent
    return {
      $node: $parent,
      offset: 0,
    };
  }

  /**
   * Deserialize Source to node positions
   */
  static deserialize(
    source: Source,
    $root: HTMLElement
  ): { start: DomNode; end: DomNode } | null {
    const $startParent = this.findParentByMeta(source.startMeta, $root);
    const $endParent = this.findParentByMeta(source.endMeta, $root);

    if (!$startParent || !$endParent) {
      console.warn('web-highlighter-plus: Could not find parent elements');
      return null;
    }

    const start = this.getTextNodeByOffset($startParent, source.startMeta.textOffset);
    const end = this.getTextNodeByOffset($endParent, source.endMeta.textOffset);

    return { start, end };
  }

  /**
   * Get selected nodes for rendering (same node case)
   * Based on web-highlighter's getNodesIfSameStartEnd
   */
  static getNodesIfSameStartEnd(
    $startNode: Text,
    startOffset: number,
    endOffset: number,
    exceptSelectors?: string[]
  ): SelectedNode[] {
    let $element: Node | null = $startNode;

    const isExcepted = ($e: HTMLElement): boolean => {
      if (!exceptSelectors || exceptSelectors.length === 0) return false;
      return exceptSelectors.some(s => {
        if (s.startsWith('.')) {
          return $e.classList.contains(s.substring(1));
        } else if (s.startsWith('#')) {
          return $e.id === s.substring(1);
        }
        return $e.tagName === s.toUpperCase();
      });
    };

    // Walk up to check if any parent is excepted
    while ($element) {
      if ($element.nodeType === Node.ELEMENT_NODE && isExcepted($element as HTMLElement)) {
        return [];
      }
      $element = $element.parentNode;
    }

    // Split and isolate the target text
    $startNode.splitText(startOffset);

    const passedNode = $startNode.nextSibling as Text;

    passedNode.splitText(endOffset - startOffset);

    return [
      {
        $node: passedNode,
        type: 'text',
        splitType: 'both',
      },
    ];
  }

  /**
   * Get selected nodes for rendering
   * Uses stack-based traversal to handle cross-node selections
   * Based on web-highlighter's getSelectedNodes
   */
  static getSelectedNodes(
    $root: HTMLElement,
    start: DomNode,
    end: DomNode,
    exceptSelectors: string[] | null = null
  ): SelectedNode[] {
    const $startNode = start.$node;
    const $endNode = end.$node;
    const startOffset = start.offset;
    const endOffset = end.offset;

    // Same node case
    if ($startNode === $endNode && $startNode instanceof Text) {
      return this.getNodesIfSameStartEnd($startNode, startOffset, endOffset, exceptSelectors || undefined);
    }

    const nodeStack: (ChildNode | Document | HTMLElement | Text)[] = [$root];
    const selectedNodes: SelectedNode[] = [];

    const isExcepted = ($e: HTMLElement): boolean => {
      if (!exceptSelectors || exceptSelectors.length === 0) return false;
      return exceptSelectors.some(s => {
        if (s.startsWith('.')) {
          return $e.classList.contains(s.substring(1));
        } else if (s.startsWith('#')) {
          return $e.id === s.substring(1);
        }
        return $e.tagName === s.toUpperCase();
      });
    };

    let withinSelectedRange = false;
    let curNode: Node | undefined;

    while ((curNode = nodeStack.pop()) !== undefined) {
      // Do not traverse into excepted nodes
      if (curNode.nodeType === Node.ELEMENT_NODE && isExcepted(curNode as HTMLElement)) {
        continue;
      }

      const children = curNode.childNodes;

      // Push children in reverse order so we process them in order
      for (let i = children.length - 1; i >= 0; i--) {
        nodeStack.push(children[i]);
      }

      // Meet the start node
      if (curNode === $startNode) {
        if (curNode.nodeType === Node.TEXT_NODE) {
          (curNode as Text).splitText(startOffset);

          const node = curNode.nextSibling as Text;

          selectedNodes.push({
            $node: node,
            type: 'text',
            splitType: 'head',
          });
        }

        // Begin to traverse
        withinSelectedRange = true;
      }
      // Meet the end node
      else if (curNode === $endNode) {
        if (curNode.nodeType === Node.TEXT_NODE) {
          const node = curNode as Text;

          node.splitText(endOffset);
          selectedNodes.push({
            $node: node,
            type: 'text',
            splitType: 'tail',
          });
        }

        // End traversal
        break;
      }
      // Handle text nodes between start and end
      else if (withinSelectedRange && curNode.nodeType === Node.TEXT_NODE) {
        selectedNodes.push({
          $node: curNode as Text,
          type: 'text',
          splitType: 'none',
        });
      }
    }

    return selectedNodes;
  }

  /**
   * Serialize a Range to Source
   */
  static serialize(
    start: DomNode,
    end: DomNode,
    text: string,
    id: string,
    $root: HTMLElement,
    extra?: unknown
  ): Source {
    return {
      id,
      text,
      startMeta: this.getDomMeta(start.$node as Text, start.offset, $root),
      endMeta: this.getDomMeta(end.$node as Text, end.offset, $root),
      extra,
    };
  }
}
