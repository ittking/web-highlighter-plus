import type { DomMeta, Source } from '../types';

/**
 * HighlightSource - Serializable representation of a highlight
 * Can be JSON serialized and stored in backend
 */
export class HighlightSource implements Source {
  id: string;
  text: string;
  startMeta: DomMeta;
  endMeta: DomMeta;
  extra?: unknown;

  constructor(
    id: string,
    text: string,
    startMeta: DomMeta,
    endMeta: DomMeta,
    extra?: unknown
  ) {
    this.id = id;
    this.text = text;
    this.startMeta = startMeta;
    this.endMeta = endMeta;
    this.extra = extra;
  }

  /**
   * Create from plain object (e.g., from JSON.parse)
   */
  static from(obj: Partial<Source>): HighlightSource {
    return new HighlightSource(
      obj.id || '',
      obj.text || '',
      obj.startMeta || { parentTagName: '', parentIndex: -1, textOffset: 0 },
      obj.endMeta || { parentTagName: '', parentIndex: -1, textOffset: 0 },
      obj.extra
    );
  }

  /**
   * Convert to plain object for serialization
   */
  toObject(): Source {
    return {
      id: this.id,
      text: this.text,
      startMeta: this.startMeta,
      endMeta: this.endMeta,
      extra: this.extra,
    };
  }

  /**
   * Serialize to JSON
   */
  toJSON(): string {
    return JSON.stringify(this.toObject());
  }
}
