var O = Object.defineProperty;
var b = (o, t, e) => t in o ? O(o, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : o[t] = e;
var a = (o, t, e) => b(o, typeof t != "symbol" ? t + "" : t, e);
const f = "data-highlight-id", g = "data-highlight-id-extra", $ = "data-highlight-split-type", H = -2, L = -1, D = "span", v = "highlight-wrap", p = ";";
class y {
  /**
   * Get text total length in all predecessors (text nodes) in the root node
   * (without offset in current node)
   */
  static getTextPreOffset(t, e) {
    var i;
    const r = [t];
    let s, n = 0;
    for (; (s = r.pop()) !== void 0; ) {
      const l = s.childNodes;
      for (let c = l.length - 1; c >= 0; c--)
        r.push(l[c]);
      if (s.nodeType === Node.TEXT_NODE && s !== e)
        n += ((i = s.textContent) == null ? void 0 : i.length) || 0;
      else if (s.nodeType === Node.TEXT_NODE)
        break;
    }
    return n;
  }
  /**
   * Find the original dom parent node (not a highlight wrapper)
   */
  static getOriginParent(t) {
    if (t instanceof HTMLElement && !t.hasAttribute("data-highlight-id"))
      return t;
    let e = t.parentNode;
    for (; e != null && e.hasAttribute("data-highlight-id"); )
      e = e.parentNode;
    return e;
  }
  /**
   * Calculate DOM metadata from a text node + offset
   * Returns parentTagName, parentIndex, and textOffset (cumulative offset from root)
   */
  static getDomMeta(t, e, r) {
    const s = this.getOriginParent(t), n = s === r ? -2 : this.countGlobalNodeIndex(s, r), i = this.getTextPreOffset(s, t);
    return {
      parentTagName: s.tagName,
      parentIndex: n,
      textOffset: i + e
    };
  }
  /**
   * Count the index of a node among its siblings with the same tag
   */
  static countGlobalNodeIndex(t, e) {
    const r = t.tagName, s = e.getElementsByTagName(r);
    for (let n = 0; n < s.length; n++)
      if (t === s[n])
        return n;
    return -1;
  }
  /**
   * Find parent element by metadata
   */
  static findParentByMeta(t, e) {
    const { parentTagName: r, parentIndex: s } = t;
    if (s === -2)
      return e;
    const n = e.getElementsByTagName(r);
    return s < n.length ? n[s] : null;
  }
  /**
   * Find text node and offset by cumulative text offset
   * Uses stack-based traversal to find the text node at the given offset
   */
  static getTextNodeByOffset(t, e) {
    var l;
    const r = [t];
    let s, n = 0, i = 0;
    for (; (s = r.pop()) !== void 0; ) {
      const c = s.childNodes;
      for (let u = c.length - 1; u >= 0; u--)
        r.push(c[u]);
      if (s.nodeType === Node.TEXT_NODE && (i = e - n, n += ((l = s.textContent) == null ? void 0 : l.length) || 0, n >= e))
        return {
          $node: s,
          offset: i
        };
    }
    return {
      $node: t,
      offset: 0
    };
  }
  /**
   * Deserialize Source to node positions
   */
  static deserialize(t, e) {
    const r = this.findParentByMeta(t.startMeta, e), s = this.findParentByMeta(t.endMeta, e);
    if (!r || !s)
      return console.warn("web-highlighter-plus: Could not find parent elements"), null;
    const n = this.getTextNodeByOffset(r, t.startMeta.textOffset), i = this.getTextNodeByOffset(s, t.endMeta.textOffset);
    return { start: n, end: i };
  }
  /**
   * Get selected nodes for rendering (same node case)
   * Based on web-highlighter's getNodesIfSameStartEnd
   */
  static getNodesIfSameStartEnd(t, e, r, s) {
    let n = t;
    const i = (c) => !s || s.length === 0 ? !1 : s.some((u) => u.startsWith(".") ? c.classList.contains(u.substring(1)) : u.startsWith("#") ? c.id === u.substring(1) : c.tagName === u.toUpperCase());
    for (; n; ) {
      if (n.nodeType === Node.ELEMENT_NODE && i(n))
        return [];
      n = n.parentNode;
    }
    t.splitText(e);
    const l = t.nextSibling;
    return l.splitText(r - e), [
      {
        $node: l,
        type: "text",
        splitType: "both"
      }
    ];
  }
  /**
   * Get selected nodes for rendering
   * Uses stack-based traversal to handle cross-node selections
   * Based on web-highlighter's getSelectedNodes
   */
  static getSelectedNodes(t, e, r, s = null) {
    const n = e.$node, i = r.$node, l = e.offset, c = r.offset;
    if (n === i && n instanceof Text)
      return this.getNodesIfSameStartEnd(n, l, c, s || void 0);
    const u = [t], N = [], E = (x) => !s || s.length === 0 ? !1 : s.some((h) => h.startsWith(".") ? x.classList.contains(h.substring(1)) : h.startsWith("#") ? x.id === h.substring(1) : x.tagName === h.toUpperCase());
    let w = !1, d;
    for (; (d = u.pop()) !== void 0; ) {
      if (d.nodeType === Node.ELEMENT_NODE && E(d))
        continue;
      const x = d.childNodes;
      for (let h = x.length - 1; h >= 0; h--)
        u.push(x[h]);
      if (d === n) {
        if (d.nodeType === Node.TEXT_NODE) {
          d.splitText(l);
          const h = d.nextSibling;
          N.push({
            $node: h,
            type: "text",
            splitType: "head"
          });
        }
        w = !0;
      } else if (d === i) {
        if (d.nodeType === Node.TEXT_NODE) {
          const h = d;
          h.splitText(c), N.push({
            $node: h,
            type: "text",
            splitType: "tail"
          });
        }
        break;
      } else w && d.nodeType === Node.TEXT_NODE && N.push({
        $node: d,
        type: "text",
        splitType: "none"
      });
    }
    return N;
  }
  /**
   * Serialize a Range to Source
   */
  static serialize(t, e, r, s, n, i) {
    return {
      id: s,
      text: r,
      startMeta: this.getDomMeta(t.$node, t.offset, n),
      endMeta: this.getDomMeta(e.$node, e.offset, n),
      extra: i
    };
  }
}
function I(o) {
  return o instanceof HTMLElement ? o.hasAttribute(f) : !1;
}
function M(o, t, e) {
  const r = `[${f}="${t}"]`, s = o.querySelector(r);
  if (s) return s;
  const n = o.querySelectorAll(`[${g}]`);
  for (const i of n)
    if ((i.getAttribute(g) || "").split(p).includes(t))
      return i;
  return null;
}
function m(o, t, e) {
  const r = [], s = `[${f}="${t}"]`, n = o.querySelectorAll(s);
  r.push(...Array.from(n));
  const i = o.querySelectorAll(`[${g}]`);
  for (const l of i)
    (l.getAttribute(g) || "").split(p).includes(t) && r.push(l);
  return r;
}
function _(o, t) {
  const e = Array.isArray(t) ? t : t.split(/\s+/);
  o.classList.add(...e);
}
function R(o, t) {
  const e = Array.isArray(t) ? t : t.split(/\s+/);
  o.classList.remove(...e);
}
function A(o, t) {
  var s;
  const e = t ? "nextSibling" : "previousSibling";
  let r = o[e];
  for (; r && r.nodeType === Node.TEXT_NODE; ) {
    const n = r[e];
    if (r.textContent === "")
      (s = r.parentNode) == null || s.removeChild(r);
    else
      break;
    r = n;
  }
}
class C {
  constructor(t, e, r, s = null) {
    a(this, "$root");
    a(this, "wrapTag");
    a(this, "className");
    a(this, "exceptSelectors");
    this.$root = t, this.wrapTag = e, this.className = r, this.exceptSelectors = s;
  }
  /**
   * Render a Source to DOM
   */
  highlightSource(t) {
    const e = y.deserialize(t, this.$root);
    return e ? this.highlightRange(
      e.start,
      e.end,
      t.id,
      t.text
    ) : [];
  }
  /**
   * Render multiple sources
   */
  highlightSources(t) {
    const e = [];
    for (const r of t) {
      const s = this.highlightSource(r);
      e.push(...s);
    }
    return e;
  }
  /**
   * Render a range to DOM
   */
  highlightRange(t, e, r, s) {
    const n = y.getSelectedNodes(
      this.$root,
      t,
      e,
      this.exceptSelectors
    );
    if (n.length === 0) return [];
    const i = [];
    for (const l of n) {
      const c = this.wrapNode(l, r);
      c && i.push(c);
    }
    return i;
  }
  /**
   * Wrap a selected node with a highlight span
   * Based on web-highlighter's wrapHighlight logic
   */
  wrapNode(t, e) {
    const { $node: r, splitType: s } = t;
    if (!(r instanceof Text)) return null;
    const n = r, i = n.parentElement;
    return i ? I(i) ? this.wrapOverlapNode(i, n, s, e) : this.wrapNewNode(n, s, e) : null;
  }
  /**
   * Wrap a new (unwrapped) text node
   */
  wrapNewNode(t, e, r) {
    var n;
    const s = document.createElement(this.wrapTag);
    if (s.setAttribute(f, r), s.setAttribute($, e), s.setAttribute(g, ""), this.className) {
      const i = Array.isArray(this.className) ? this.className : this.className.split(/\s+/);
      s.classList.add(...i);
    }
    return (n = t.parentNode) == null || n.replaceChild(s, t), s.appendChild(t), s;
  }
  /**
   * Wrap when node is already inside a highlight wrapper (overlap handling)
   */
  wrapOverlapNode(t, e, r, s) {
    const n = t.getAttribute(f) || "", i = (t.getAttribute(g) || "").split(p).filter(Boolean);
    return s !== n && !i.includes(s) && (i.push(s), t.setAttribute(g, i.join(p))), t;
  }
  /**
   * Remove a highlight by ID
   */
  removeHighlight(t) {
    const e = m(this.$root, t, this.wrapTag);
    if (e.length === 0) return !1;
    for (const r of e) {
      const s = (r.getAttribute(g) || "").split(p).filter(Boolean);
      if (s.length === 0)
        this.unwrapWrapper(r);
      else {
        const n = s.indexOf(t);
        n !== -1 && s.splice(n, 1), s.length > 0 ? (r.setAttribute(f, s[0]), s.shift(), r.setAttribute(g, s.join(p))) : r.removeAttribute(g);
      }
    }
    return !0;
  }
  /**
   * Remove all highlights
   */
  removeAllHighlights() {
    this.$root.querySelectorAll(
      `[${f}]`
    ).forEach((e) => {
      this.unwrapWrapper(e);
    });
  }
  /**
   * Unwrap a highlight wrapper, preserving content
   */
  unwrapWrapper(t) {
    var r, s;
    const e = t.parentNode;
    if (e) {
      for (; t.firstChild; )
        e.insertBefore(t.firstChild, t);
      e.removeChild(t), ((r = t.previousSibling) == null ? void 0 : r.nodeType) === Node.TEXT_NODE && A(t.previousSibling, !0), ((s = t.nextSibling) == null ? void 0 : s.nodeType) === Node.TEXT_NODE && A(t.nextSibling, !1);
    }
  }
  /**
   * Add class to highlight wrapper(s)
   */
  addClassToHighlight(t, e) {
    const r = m(this.$root, t, this.wrapTag);
    for (const s of r)
      _(s, e);
  }
  /**
   * Remove class from highlight wrapper(s)
   */
  removeClassFromHighlight(t, e) {
    const r = m(this.$root, t, this.wrapTag);
    for (const s of r)
      R(s, e);
  }
  /**
   * Get all wrapper elements
   */
  getDoms(t) {
    if (t) {
      const e = M(this.$root, t, this.wrapTag);
      return e ? [e] : [];
    }
    return Array.from(
      this.$root.querySelectorAll(`[${f}]`)
    );
  }
  /**
   * Get highlight ID from a DOM node
   */
  getIdByDom(t) {
    const e = this.$root.querySelector(
      `[${f}="${t}"]`
    );
    if (e)
      return e.getAttribute(f) || "";
    const r = this.$root.querySelectorAll(
      `[${g}]`
    );
    for (const s of r)
      if ((s.getAttribute(g) || "").split(p).includes(t.textContent || ""))
        return s.getAttribute(f) || "";
    return "";
  }
}
function X() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (o) => {
    const t = Math.random() * 16 | 0;
    return (o === "x" ? t : t & 3 | 8).toString(16);
  });
}
class T {
  constructor(t, e, r, s) {
    a(this, "start");
    a(this, "end");
    a(this, "text");
    a(this, "id");
    a(this, "frozen", !1);
    this.start = t, this.end = e, this.text = r, this.id = s;
  }
  /**
   * Create a HighlightRange from a native Range object
   */
  static fromRange(t, e) {
    const r = t.startContainer, s = t.endContainer;
    if (r.nodeType !== Node.TEXT_NODE || s.nodeType !== Node.TEXT_NODE)
      return console.warn("web-highlighter-plus: Only text nodes can be highlighted"), null;
    const n = e || X(), i = t.toString();
    return new T(
      { $node: r, offset: t.startOffset },
      { $node: s, offset: t.endOffset },
      i,
      n
    );
  }
  /**
   * Create a HighlightRange from a window selection
   */
  static fromSelection(t) {
    const e = window.getSelection();
    if (!e || e.isCollapsed) return null;
    const r = e.getRangeAt(0);
    return T.fromRange(r, t);
  }
  /**
   * Freeze the range before rendering
   */
  freeze() {
    this.frozen = !0;
  }
  /**
   * Clear the browser selection
   */
  static removeDomRange() {
    const t = window.getSelection();
    t && t.removeAllRanges();
  }
}
class S {
  constructor(t, e, r, s, n) {
    a(this, "id");
    a(this, "text");
    a(this, "startMeta");
    a(this, "endMeta");
    a(this, "extra");
    this.id = t, this.text = e, this.startMeta = r, this.endMeta = s, this.extra = n;
  }
  /**
   * Create from plain object (e.g., from JSON.parse)
   */
  static from(t) {
    return new S(
      t.id || "",
      t.text || "",
      t.startMeta || { parentTagName: "", parentIndex: -1, textOffset: 0 },
      t.endMeta || { parentTagName: "", parentIndex: -1, textOffset: 0 },
      t.extra
    );
  }
  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      text: this.text,
      startMeta: this.startMeta,
      endMeta: this.endMeta,
      extra: this.extra
    };
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }
}
class P {
  constructor(t = {}) {
    a(this, "$root");
    a(this, "wrapTag");
    a(this, "className");
    a(this, "exceptSelectors");
    a(this, "verbose");
    a(this, "painter");
    a(this, "_sources", /* @__PURE__ */ new Map());
    this.$root = t.root || document.body, this.wrapTag = t.wrapTag || D, this.className = t.className || v, this.exceptSelectors = t.exceptSelectors ?? null, this.verbose = t.verbose ?? !1, this.painter = new C(
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
  fromRange(t) {
    const e = T.fromRange(t);
    if (!e) return null;
    const r = y.serialize(
      e.start,
      e.end,
      e.text,
      e.id,
      this.$root
    );
    return this._sources.set(r.id, r), this.log(`Serialized: ${r.id} - "${r.text.substring(0, 20)}..."`), r;
  }
  /**
   * Create a Source from a window selection
   */
  fromSelection() {
    var e;
    return T.fromSelection() ? (T.removeDomRange(), this.fromRange(
      ((e = document.getSelection()) == null ? void 0 : e.getRangeAt(0)) || document.createRange()
    )) : null;
  }
  /**
   * Create Source from stored metadata (for restoration)
   * F4: Batch restore - restores highlights from persisted data
   */
  fromStore(t, e, r, s, n) {
    const i = { id: s, text: r, startMeta: t, endMeta: e, extra: n };
    return this._sources.set(s, i), i;
  }
  /**
   * F2: Render Source to DOM - wraps text in span elements
   * This is the core rendering function that handles cross-tag selection
   */
  render(t) {
    const e = this.painter.highlightSource(t);
    return this.log(`Rendered: ${t.id} - ${e.length} element(s)`), e;
  }
  /**
   * F3: Render multiple sources at once
   */
  renderAll(t) {
    const e = [];
    for (const r of t) {
      const s = this.render(r);
      e.push(...s);
    }
    return e;
  }
  /**
   * F4: Restore multiple highlights from stored data
   * Combines fromStore + render in one call
   */
  restore(t) {
    return this.renderAll(t);
  }
  /**
   * F5a: Remove a single highlight by ID
   */
  remove(t) {
    this.painter.removeHighlight(t), this._sources.delete(t), this.log(`Removed: ${t}`);
  }
  /**
   * F5b: Remove all highlights
   */
  removeAll() {
    this.painter.removeAllHighlights(), this._sources.clear(), this.log("Removed all highlights");
  }
  /**
   * F3: Add CSS class to a highlight by ID
   */
  addClass(t, e) {
    this.painter.addClassToHighlight(t, e), this.log(`Added class "${e}" to ${t}`);
  }
  /**
   * F3: Remove CSS class from a highlight by ID
   */
  removeClass(t, e) {
    this.painter.removeClassFromHighlight(t, e), this.log(`Removed class "${e}" from ${t}`);
  }
  /**
   * Get wrapper DOM elements for a highlight ID
   * If no ID provided, returns all wrappers
   */
  getDoms(t) {
    return this.painter.getDoms(t);
  }
  /**
   * Get highlight ID from a DOM node
   */
  getIdByDom(t) {
    return this.painter.getIdByDom(t);
  }
  /**
   * Get all stored sources
   */
  getSources() {
    return Array.from(this._sources.values());
  }
  /**
   * Get a source by ID
   */
  getSource(t) {
    return this._sources.get(t);
  }
  /**
   * Static: Check if an object is a Source
   */
  static isSource(t) {
    return typeof t == "object" && t !== null && "id" in t && "text" in t && "startMeta" in t && "endMeta" in t;
  }
  /**
   * Static: Check if a DOM node is a highlight wrapper
   */
  static isHighlightWrapNode(t) {
    return t instanceof HTMLElement && t.hasAttribute("data-highlight-id");
  }
  /**
   * Private logging helper
   */
  log(t) {
    this.verbose && console.log(`[web-highlighter-plus] ${t}`);
  }
}
export {
  f as ATTR_IDENTIFIER,
  g as ATTR_IDENTIFIER_EXTRA,
  $ as ATTR_SPLIT_TYPE,
  v as DEFAULT_CLASS_NAME,
  D as DEFAULT_WRAP_TAG,
  T as HighlightRange,
  S as HighlightSource,
  P as HighlighterPlus,
  p as ID_DIVISION,
  H as ROOT_IDX,
  L as UNKNOWN_IDX,
  X as createUUID
};
