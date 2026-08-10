import type { Options, Source } from '../types';
import { DEFAULT_CLASS_NAME, DEFAULT_WRAP_TAG } from '../utils/const';
import { Painter } from './Painter';
import { Serializer } from './Serializer';
import { HighlightRange } from '../model/Range';

/**
 * HighlighterPlus - Core class for text highlighting and serialization
 *
 * Features:
 * - Serialize Range to Source for persistence
 * - Render Source to DOM as span elements (cross-tag support)
 * - Add/remove CSS classes to highlights
 * - Batch restore from stored data
 * - Remove single or all highlights
 */
export class HighlighterPlus {
  private $root: HTMLElement;
  private wrapTag: string;
  private className: string;
  private exceptSelectors: string[] | null;
  private verbose: boolean;
  private painter: Painter;
  private _sources: Map<string, Source> = new Map();

  constructor(options: Options = {}) {
    this.$root = (options.root as HTMLElement) || document.body;
    this.wrapTag = options.wrapTag || DEFAULT_WRAP_TAG;
    this.className = (options.className as string) || DEFAULT_CLASS_NAME;
    this.exceptSelectors = options.exceptSelectors ?? null;
    this.verbose = options.verbose ?? false;

    this.painter = new Painter(
      this.$root,
      this.wrapTag,
      this.className,
      this.exceptSelectors
    );
  }

  /**
   * Create a Source from a native Range object
   * F1: Serialize - converts Range to storable Source
   */
  fromRange(range: Range): Source | null {
    const rangeData = HighlightRange.fromRange(range);
    if (!rangeData) return null;

    const source = Serializer.serialize(
      rangeData.start,
      rangeData.end,
      rangeData.text,
      rangeData.id,
      this.$root
    );

    this._sources.set(source.id, source);
    this.log(`Serialized: ${source.id} - "${source.text.substring(0, 20)}..."`);

    return source;
  }

  /**
   * Create a Source from a window selection
   */
  fromSelection(): Source | null {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    const source = this.fromRange(range);

    selection.removeAllRanges();
    return source;
  }

  /**
   * Create Source from stored metadata (for restoration)
   * F4: Batch restore - restores highlights from persisted data
   */
  fromStore(
    startMeta: Source['startMeta'],
    endMeta: Source['endMeta'],
    text: string,
    id: string,
    extra?: unknown
  ): Source | null {
    const source: Source = { id, text, startMeta, endMeta, extra };
    this._sources.set(id, source);
    return source;
  }

  /**
   * F2: Render Source to DOM - wraps text in span elements
   * This is the core rendering function that handles cross-tag selection
   */
  render(source: Source): HTMLElement[] {
    const doms = this.painter.highlightSource(source);
    this.log(`Rendered: ${source.id} - ${doms.length} element(s)`);
    return doms;
  }

  /**
   * F3: Render multiple sources at once
   */
  renderAll(sources: Source[]): HTMLElement[] {
    const allDoms: HTMLElement[] = [];
    for (const source of sources) {
      const doms = this.render(source);
      allDoms.push(...doms);
    }
    return allDoms;
  }

  /**
   * F4: Restore multiple highlights from stored data
   * Combines fromStore + render in one call
   */
  restore(sources: Source[]): HTMLElement[] {
    return this.renderAll(sources);
  }

  /**
   * F5a: Remove a single highlight by ID
   */
  remove(id: string): void {
    this.painter.removeHighlight(id);
    this._sources.delete(id);
    this.log(`Removed: ${id}`);
  }

  /**
   * F5b: Remove all highlights
   */
  removeAll(): void {
    this.painter.removeAllHighlights();
    this._sources.clear();
    this.log('Removed all highlights');
  }

  /**
   * F3: Add CSS class to a highlight by ID
   */
  addClass(id: string, className: string): void {
    this.painter.addClassToHighlight(id, className);
    this.log(`Added class "${className}" to ${id}`);
  }

  /**
   * F3: Remove CSS class from a highlight by ID
   */
  removeClass(id: string, className: string): void {
    this.painter.removeClassFromHighlight(id, className);
    this.log(`Removed class "${className}" from ${id}`);
  }

  /**
   * Get wrapper DOM elements for a highlight ID
   * If no ID provided, returns all wrappers
   */
  getDoms(id?: string): HTMLElement[] {
    return this.painter.getDoms(id);
  }

  /**
   * Get highlight ID from a DOM node
   */
  getIdByDom($node: HTMLElement | Node): string {
    return this.painter.getIdByDom($node);
  }

  /**
   * Get all stored sources
   */
  getSources(): Source[] {
    return Array.from(this._sources.values());
  }

  /**
   * Get a source by ID
   */
  getSource(id: string): Source | undefined {
    return this._sources.get(id);
  }

  /**
   * Static: Check if an object is a Source
   */
  static isSource(obj: unknown): obj is Source {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'text' in obj &&
      'startMeta' in obj &&
      'endMeta' in obj
    );
  }

  /**
   * Static: Check if a DOM node is a highlight wrapper
   */
  static isHighlightWrapNode($node: Node): boolean {
    return $node instanceof HTMLElement && $node.hasAttribute('data-highlight-id');
  }

  /**
   * Private logging helper
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[web-highlighter-plus] ${message}`);
    }
  }
}

export { HighlightSource } from '../model/Source';
export { HighlightRange } from '../model/Range';
export type { Source, DomMeta, DomNode, Options } from '../types';
