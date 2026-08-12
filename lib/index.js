var v = Object.defineProperty;
var $ = (a, t, e) => t in a ? v(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var o = (a, t, e) => $(a, typeof t != "symbol" ? t + "" : t, e);
const d = "data-highlight-id", g = "data-highlight-id-extra", S = "data-highlight-split-type", H = -2, P = -1, O = "span", b = "highlight-wrap", p = ";";
class E {
  /**
   * Get text total length in all predecessors (text nodes) in the root node
   * (without offset in current node)
   */
  static getTextPreOffset(t, e) {
    var i;
    const s = [t];
    let r, n = 0;
    for (; (r = s.pop()) !== void 0; ) {
      const l = r.childNodes;
      for (let c = l.length - 1; c >= 0; c--)
        s.push(l[c]);
      if (r.nodeType === Node.TEXT_NODE && r !== e)
        n += ((i = r.textContent) == null ? void 0 : i.length) || 0;
      else if (r.nodeType === Node.TEXT_NODE)
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
  static getDomMeta(t, e, s) {
    const r = this.getOriginParent(t), n = r === s ? -2 : this.countGlobalNodeIndex(r, s), i = this.getTextPreOffset(r, t);
    return {
      parentTagName: r.tagName,
      parentIndex: n,
      textOffset: i + e
    };
  }
  /**
   * Count the index of a node among its siblings with the same tag
   */
  static countGlobalNodeIndex(t, e) {
    const s = t.tagName, r = e.getElementsByTagName(s);
    for (let n = 0; n < r.length; n++)
      if (t === r[n])
        return n;
    return -1;
  }
  /**
   * Find parent element by metadata
   */
  static findParentByMeta(t, e) {
    const { parentTagName: s, parentIndex: r } = t;
    if (r === -2)
      return e;
    const n = e.getElementsByTagName(s);
    return r < n.length ? n[r] : null;
  }
  /**
   * Find text node and offset by cumulative text offset
   * Uses stack-based traversal to find the text node at the given offset
   */
  static getTextNodeByOffset(t, e) {
    var l;
    const s = [t];
    let r, n = 0, i = 0;
    for (; (r = s.pop()) !== void 0; ) {
      const c = r.childNodes;
      for (let f = c.length - 1; f >= 0; f--)
        s.push(c[f]);
      if (r.nodeType === Node.TEXT_NODE && (i = e - n, n += ((l = r.textContent) == null ? void 0 : l.length) || 0, n >= e))
        return {
          $node: r,
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
    const s = this.findParentByMeta(t.startMeta, e), r = this.findParentByMeta(t.endMeta, e);
    if (!s || !r)
      return console.warn("web-highlighter-plus: Could not find parent elements"), null;
    const n = this.getTextNodeByOffset(s, t.startMeta.textOffset), i = this.getTextNodeByOffset(r, t.endMeta.textOffset);
    return { start: n, end: i };
  }
  /**
   * Get selected nodes for rendering (same node case)
   * Based on web-highlighter's getNodesIfSameStartEnd
   */
  static getNodesIfSameStartEnd(t, e, s, r) {
    let n = t;
    const i = (c) => !r || r.length === 0 ? !1 : r.some((f) => f.startsWith(".") ? c.classList.contains(f.substring(1)) : f.startsWith("#") ? c.id === f.substring(1) : c.tagName === f.toUpperCase());
    for (; n; ) {
      if (n.nodeType === Node.ELEMENT_NODE && i(n))
        return [];
      n = n.parentNode;
    }
    t.splitText(e);
    const l = t.nextSibling;
    return !l || !l.textContent || l.textContent.trim().length === 0 ? [] : (l.splitText(s - e), [
      {
        $node: l,
        type: "text",
        splitType: "both"
      }
    ]);
  }
  /**
   * Get selected nodes for rendering
   * Uses stack-based traversal to handle cross-node selections
   * Based on web-highlighter's getSelectedNodes
   */
  static getSelectedNodes(t, e, s, r = null) {
    const n = e.$node, i = s.$node, l = e.offset, c = s.offset;
    if (n === i && n instanceof Text)
      return this.getNodesIfSameStartEnd(n, l, c, r || void 0);
    const f = [t], x = [], y = (m) => !r || r.length === 0 ? !1 : r.some((h) => h.startsWith(".") ? m.classList.contains(h.substring(1)) : h.startsWith("#") ? m.id === h.substring(1) : m.tagName === h.toUpperCase());
    let w = !1, u;
    for (; (u = f.pop()) !== void 0; ) {
      if (u.nodeType === Node.ELEMENT_NODE && y(u))
        continue;
      const m = u.childNodes;
      for (let h = m.length - 1; h >= 0; h--)
        f.push(m[h]);
      if (u === n) {
        if (u.nodeType === Node.TEXT_NODE) {
          u.splitText(l);
          const h = u.nextSibling;
          x.push({
            $node: h,
            type: "text",
            splitType: "head"
          });
        }
        w = !0;
      } else if (u === i) {
        if (u.nodeType === Node.TEXT_NODE) {
          const h = u;
          h.splitText(c), x.push({
            $node: h,
            type: "text",
            splitType: "tail"
          });
        }
        break;
      } else if (w && u.nodeType === Node.TEXT_NODE) {
        const h = u;
        h.textContent && h.textContent.trim().length > 0 && x.push({
          $node: h,
          type: "text",
          splitType: "none"
        });
      }
    }
    return x;
  }
  /**
   * Serialize a Range to Source
   */
  static serialize(t, e, s, r, n, i) {
    return {
      id: r,
      text: s,
      startMeta: this.getDomMeta(t.$node, t.offset, n),
      endMeta: this.getDomMeta(e.$node, e.offset, n),
      extra: i
    };
  }
}
function D(a) {
  return a instanceof HTMLElement ? a.hasAttribute(d) : !1;
}
function I(a, t, e) {
  const s = `[${d}="${t}"]`, r = a.querySelector(s);
  if (r) return r;
  const n = a.querySelectorAll(`[${g}]`);
  for (const i of n)
    if ((i.getAttribute(g) || "").split(p).includes(t))
      return i;
  return null;
}
function T(a, t, e) {
  const s = [], r = `[${d}="${t}"]`, n = a.querySelectorAll(r);
  s.push(...Array.from(n));
  const i = a.querySelectorAll(`[${g}]`);
  for (const l of i)
    (l.getAttribute(g) || "").split(p).includes(t) && s.push(l);
  return s;
}
function M(a, t) {
  const e = Array.isArray(t) ? t : t.split(/\s+/);
  a.classList.add(...e);
}
function C(a, t) {
  const e = Array.isArray(t) ? t : t.split(/\s+/);
  a.classList.remove(...e);
}
class _ {
  constructor(t, e, s, r = null) {
    o(this, "$root");
    o(this, "wrapTag");
    o(this, "className");
    o(this, "exceptSelectors");
    this.$root = t, this.wrapTag = e, this.className = s, this.exceptSelectors = r;
  }
  /**
   * Render a Source to DOM
   */
  highlightSource(t) {
    const e = E.deserialize(t, this.$root);
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
    for (const s of t) {
      const r = this.highlightSource(s);
      e.push(...r);
    }
    return e;
  }
  /**
   * Render a range to DOM
   */
  highlightRange(t, e, s, r) {
    const n = E.getSelectedNodes(
      this.$root,
      t,
      e,
      this.exceptSelectors
    );
    if (n.length === 0) return [];
    const i = [];
    for (const l of n) {
      const c = this.wrapNode(l, s);
      c && i.push(c);
    }
    return i;
  }
  /**
   * Wrap a selected node with a highlight span
   * Based on web-highlighter's wrapHighlight logic
   */
  wrapNode(t, e) {
    const { $node: s, splitType: r } = t;
    if (!(s instanceof Text)) return null;
    const n = s, i = n.parentElement;
    return !i || !n.textContent || n.textContent.trim().length === 0 ? null : D(i) ? this.wrapOverlapNode(i, n, r, e) : this.wrapNewNode(n, r, e);
  }
  /**
   * Wrap a new (unwrapped) text node
   */
  wrapNewNode(t, e, s) {
    var n;
    const r = document.createElement(this.wrapTag);
    if (r.setAttribute(d, s), r.setAttribute(S, e), r.setAttribute(g, ""), this.className) {
      const i = Array.isArray(this.className) ? this.className : this.className.split(/\s+/);
      r.classList.add(...i);
    }
    return (n = t.parentNode) == null || n.replaceChild(r, t), r.appendChild(t), r;
  }
  /**
   * Wrap when node is already inside a highlight wrapper (overlap handling)
   */
  wrapOverlapNode(t, e, s, r) {
    const n = t.getAttribute(d) || "", i = (t.getAttribute(g) || "").split(p).filter(Boolean);
    return r !== n && !i.includes(r) && (i.push(r), t.setAttribute(g, i.join(p))), t;
  }
  /**
   * Remove a highlight by ID
   */
  removeHighlight(t) {
    const e = T(this.$root, t, this.wrapTag);
    if (e.length === 0) return !1;
    for (const s of e) {
      const r = (s.getAttribute(g) || "").split(p).filter(Boolean);
      if (r.length === 0)
        this.unwrapWrapper(s);
      else {
        const n = r.indexOf(t);
        n !== -1 && r.splice(n, 1), r.length > 0 ? (s.setAttribute(d, r[0]), r.shift(), s.setAttribute(g, r.join(p))) : s.removeAttribute(g);
      }
    }
    return !0;
  }
  /**
   * Remove all highlights
   */
  removeAllHighlights() {
    this.$root.querySelectorAll(
      `[${d}]`
    ).forEach((e) => {
      this.unwrapWrapper(e);
    });
  }
  /**
   * Unwrap a highlight wrapper, preserving content
   */
  unwrapWrapper(t) {
    const e = t.parentNode;
    if (e) {
      for (; t.firstChild; )
        e.insertBefore(t.firstChild, t);
      e.removeChild(t), e.normalize();
    }
  }
  /**
   * Add class to highlight wrapper(s)
   */
  addClassToHighlight(t, e) {
    const s = T(this.$root, t, this.wrapTag);
    for (const r of s)
      M(r, e);
  }
  /**
   * Remove class from highlight wrapper(s)
   */
  removeClassFromHighlight(t, e) {
    const s = T(this.$root, t, this.wrapTag);
    for (const r of s)
      C(r, e);
  }
  /**
   * Get all wrapper elements
   */
  getDoms(t) {
    if (t) {
      const e = I(this.$root, t, this.wrapTag);
      return e ? [e] : [];
    }
    return Array.from(
      this.$root.querySelectorAll(`[${d}]`)
    );
  }
  /**
   * Get highlight ID from a DOM node
   */
  getIdByDom(t) {
    const e = this.$root.querySelector(
      `[${d}="${t}"]`
    );
    if (e)
      return e.getAttribute(d) || "";
    const s = this.$root.querySelectorAll(
      `[${g}]`
    );
    for (const r of s)
      if ((r.getAttribute(g) || "").split(p).includes(t.textContent || ""))
        return r.getAttribute(d) || "";
    return "";
  }
}
function R() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (a) => {
    const t = Math.random() * 16 | 0;
    return (a === "x" ? t : t & 3 | 8).toString(16);
  });
}
class N {
  constructor(t, e, s, r) {
    o(this, "start");
    o(this, "end");
    o(this, "text");
    o(this, "id");
    o(this, "frozen", !1);
    this.start = t, this.end = e, this.text = s, this.id = r;
  }
  /**
   * Create a HighlightRange from a native Range object
   */
  static fromRange(t, e) {
    const s = t.startContainer, r = t.endContainer;
    if (s.nodeType !== Node.TEXT_NODE || r.nodeType !== Node.TEXT_NODE)
      return console.warn("web-highlighter-plus: Only text nodes can be highlighted"), null;
    const n = e || R(), i = t.toString();
    return new N(
      { $node: s, offset: t.startOffset },
      { $node: r, offset: t.endOffset },
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
    const s = e.getRangeAt(0);
    return N.fromRange(s, t);
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
class A {
  constructor(t, e, s, r, n) {
    o(this, "id");
    o(this, "text");
    o(this, "startMeta");
    o(this, "endMeta");
    o(this, "extra");
    this.id = t, this.text = e, this.startMeta = s, this.endMeta = r, this.extra = n;
  }
  /**
   * Create from plain object (e.g., from JSON.parse)
   */
  static from(t) {
    return new A(
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
class B {
  constructor() {
    o(this, "handlers", /* @__PURE__ */ new Map());
  }
  on(t, e) {
    this.handlers.has(t) || this.handlers.set(t, /* @__PURE__ */ new Set()), this.handlers.get(t).add(e);
  }
  off(t, e) {
    var s;
    (s = this.handlers.get(t)) == null || s.delete(e);
  }
  emit(t, e) {
    var s;
    (s = this.handlers.get(t)) == null || s.forEach((r) => {
      try {
        r(e);
      } catch (n) {
        console.error(`[web-highlighter-plus] Error in ${t} handler:`, n);
      }
    });
  }
}
class X {
  constructor(t = {}) {
    o(this, "$root");
    o(this, "wrapTag");
    o(this, "className");
    o(this, "exceptSelectors");
    o(this, "verbose");
    o(this, "painter");
    o(this, "_sources", /* @__PURE__ */ new Map());
    o(this, "eventEmitter");
    o(this, "eventHandlersBound", !1);
    this.$root = t.root || document.body, this.wrapTag = t.wrapTag || O, this.className = t.className || b, this.exceptSelectors = t.exceptSelectors ?? null, this.verbose = t.verbose ?? !1, this.eventEmitter = new B(), this.painter = new _(
      this.$root,
      this.wrapTag,
      this.className,
      this.exceptSelectors
    ), this.bindEventListeners();
  }
  /**
   * Bind event listeners to root element
   */
  bindEventListeners() {
    this.eventHandlersBound || (this.eventHandlersBound = !0, this.$root.addEventListener("mouseenter", (t) => {
      var n;
      const e = t.target;
      if (!((n = e.hasAttribute) != null && n.call(e, d))) return;
      const s = e.getAttribute(d);
      if (!s) return;
      const r = this.getDoms(s);
      this.eventEmitter.emit("render:hover", {
        id: s,
        doms: r,
        event: t
      });
    }, !0), this.$root.addEventListener("mouseleave", (t) => {
      var n;
      const e = t.target;
      if (!((n = e.hasAttribute) != null && n.call(e, d))) return;
      const s = e.getAttribute(d);
      if (!s) return;
      const r = this.getDoms(s);
      this.eventEmitter.emit("render:hover-out", {
        id: s,
        doms: r,
        event: t
      });
    }, !0), this.$root.addEventListener("click", (t) => {
      var n;
      const e = t.target;
      if (!((n = e.hasAttribute) != null && n.call(e, d))) return;
      const s = e.getAttribute(d);
      if (!s) return;
      const r = this.getDoms(s);
      this.eventEmitter.emit("render:click", {
        id: s,
        doms: r,
        event: t
      });
    }, !0));
  }
  /**
   * Create a Source from a native Range object
   * F1: Serialize - converts Range to storable Source
   */
  fromRange(t) {
    const e = N.fromRange(t);
    if (!e) return null;
    const s = E.serialize(
      e.start,
      e.end,
      e.text,
      e.id,
      this.$root
    );
    return this._sources.set(s.id, s), this.log(`Serialized: ${s.id} - "${s.text.substring(0, 20)}..."`), s;
  }
  /**
   * Create a Source from a window selection
   */
  fromSelection() {
    const t = document.getSelection();
    if (!t || t.isCollapsed) return null;
    const e = t.getRangeAt(0), s = this.fromRange(e);
    return t.removeAllRanges(), s;
  }
  /**
   * Create Source from stored metadata (for restoration)
   * F4: Batch restore - restores highlights from persisted data
   */
  fromStore(t) {
    const e = t.id || crypto.randomUUID(), s = { ...t, id: e };
    return this._sources.set(e, s), s;
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
    for (const s of t) {
      const r = this.render(s);
      e.push(...r);
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
   * Add event listener for render interactions
   * @param event - Event type: 'render:hover', 'render:hover-out', 'render:click'
   * @param handler - Event handler function
   */
  on(t, e) {
    this.eventEmitter.on(t, e), this.log(`Added listener for ${t}`);
  }
  /**
   * Remove event listener for render interactions
   * @param event - Event type
   * @param handler - Event handler to remove
   */
  off(t, e) {
    this.eventEmitter.off(t, e), this.log(`Removed listener for ${t}`);
  }
  /**
   * Private logging helper
   */
  log(t) {
    this.verbose && console.log(`[web-highlighter-plus] ${t}`);
  }
}
export {
  d as ATTR_IDENTIFIER,
  g as ATTR_IDENTIFIER_EXTRA,
  S as ATTR_SPLIT_TYPE,
  b as DEFAULT_CLASS_NAME,
  O as DEFAULT_WRAP_TAG,
  N as HighlightRange,
  A as HighlightSource,
  X as HighlighterPlus,
  p as ID_DIVISION,
  H as ROOT_IDX,
  P as UNKNOWN_IDX,
  R as createUUID
};
