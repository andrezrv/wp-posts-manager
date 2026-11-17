/**
 * @file Bridge between WordPress blocks and TipTap visual editing.
 *
 * Converts WordPress block markup into TipTap-editable HTML and back,
 * preserving block comment delimiters through round-trips. This is what
 * prevents blocks from degrading to "Classic" in the WordPress editor.
 *
 * The bridge maintains a registry mapping `data-wp-key` attributes to
 * original block metadata. Untouched blocks round-trip byte-for-byte;
 * edited blocks are re-serialized with correct `<!-- wp:... -->` comments.
 *
 * Supported blocks (editable): paragraph, heading, list, quote, preformatted.
 * Unsupported blocks render as locked read-only previews.
 *
 * @see {@link ./blockParser.js} for parsing block comments.
 * @see {@link ./blockSerializer.js} for serializing back to block format.
 */

import { hasBlocks, parseBlocks } from './blockParser';
import { cleanOuter, serializeNode } from './blockSerializer';
import { esc } from '../utils/format';

/** Block types that map to a single HTML element and can be edited directly. */
const SIMPLE_BLOCKS = {
  'core/paragraph': /^P$/,
  'core/heading': /^H[1-6]$/,
  'core/preformatted': /^PRE$/,
  'core/code': /^PRE$/,
};

function parseBody(html) {
  return new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html').body;
}

function singleElement(html) {
  const nodes = Array.from(parseBody(String(html).trim()).childNodes).filter(
    (n) => !(n.nodeType === 3 && !n.textContent.trim()),
  );
  return nodes.length === 1 && nodes[0].nodeType === 1 ? nodes[0] : null;
}

function removeComments(el) {
  const w = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_COMMENT);
  const found = [];
  while (w.nextNode()) found.push(w.currentNode);
  found.forEach((n) => n.remove());
  return el;
}

const everyDescendant = (b, ok) => b.children.every((c) => ok(c) && everyDescendant(c, ok));
const attrsLimitedTo = (b, keys) =>
  b.attrs !== null && Object.keys(b.attrs).every((k) => keys.includes(k));
const blockLabel = (name) => {
  const s = name.replace(/^core\//, '').replace(/[-_/]+/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Create a new block bridge instance with its own registry.
 *
 * @returns {{ toVisual: Function, snapshotClean: Function, toRaw: Function, registry: Map, hasBlocks: Function }}
 */
export function createBlockBridge() {
  const registry = new Map();
  let blockOrder = [];
  let keySeq = 0;

  function blockToVisual(item) {
    const key = 'k' + ++keySeq;

    if (item.type === 'block' && item.attrs !== null) {
      let el = null;
      let kind = null;

      if (SIMPLE_BLOCKS[item.name]) {
        el = singleElement(item.innerRaw);
        if (el && SIMPLE_BLOCKS[item.name].test(el.tagName) && !item.children.length)
          kind = 'simple';
      } else if (item.name === 'core/list') {
        el = singleElement(item.innerRaw);
        if (
          el &&
          /^(UL|OL)$/.test(el.tagName) &&
          everyDescendant(
            item,
            (c) =>
              (c.name === 'core/list-item' && attrsLimitedTo(c, [])) ||
              (c.name === 'core/list' && attrsLimitedTo(c, ['ordered'])),
          )
        )
          kind = 'list';
      } else if (item.name === 'core/quote') {
        el = singleElement(item.innerRaw);
        if (
          el &&
          el.tagName === 'BLOCKQUOTE' &&
          everyDescendant(item, (c) => c.name === 'core/paragraph' && attrsLimitedTo(c, []))
        )
          kind = 'quote';
      }

      if (kind) {
        removeComments(el);
        el.setAttribute('data-wp-key', key);
        registry.set(key, {
          kind,
          name: item.name,
          short: item.short,
          attrsStr: item.attrsStr,
          raw: item.raw,
          tag: el.tagName,
        });
        blockOrder.push({ key, locked: false });
        return el.outerHTML;
      }
    }

    const innerHtml = (item.type === 'freeform' ? item.raw : item.innerRaw || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .trim();
    registry.set(key, { kind: 'locked', raw: item.raw });
    blockOrder.push({ key, locked: true });

    const label = item.type === 'freeform' ? 'Classic content' : blockLabel(item.name) + ' block';
    return `<div data-wp-locked="${key}" data-wp-label="${esc(label)}" data-wp-preview="${esc(innerHtml)}"></div>`;
  }

  function toVisual(raw) {
    registry.clear();
    blockOrder = [];
    keySeq = 0;

    if (!hasBlocks(raw)) {
      return { html: raw, blockMode: false };
    }

    const items = parseBlocks(raw);
    if (!items) {
      return { html: raw, blockMode: false, malformed: true };
    }

    const visualParts = [];
    let prevLocked = false;
    items.forEach((item, i) => {
      const vis = blockToVisual(item);
      const isLocked = blockOrder[blockOrder.length - 1].locked;
      if (isLocked && i === 0) visualParts.push('<p></p>');
      if (isLocked && prevLocked) visualParts.push('<p></p>');
      visualParts.push(vis);
      prevLocked = isLocked;
    });
    if (prevLocked) visualParts.push('<p></p>');
    const html = visualParts.join('');
    return { html, blockMode: true };
  }

  function snapshotClean(root) {
    root.querySelectorAll('[data-wp-key]').forEach((el) => {
      const meta = registry.get(el.getAttribute('data-wp-key'));
      if (meta && meta.kind !== 'locked') meta.clean = cleanOuter(el);
    });
  }

  function toRaw(root) {
    if (!blockOrder.length) {
      return serializeFromDom(root);
    }

    const editableChildren = Array.from(root.children).filter(
      (el) => el.nodeType === 1 && !el.hasAttribute('data-wp-locked'),
    );
    const parts = [];
    const seen = new Set();
    seen._registry = registry;
    let domIdx = 0;

    for (const entry of blockOrder) {
      if (entry.locked) {
        const meta = registry.get(entry.key);
        if (meta) parts.push(meta.raw);
      } else {
        if (domIdx < editableChildren.length) {
          parts.push(serializeNode(editableChildren[domIdx], seen));
          domIdx++;
        }
      }
    }

    for (let i = domIdx; i < editableChildren.length; i++) {
      parts.push(serializeNode(editableChildren[i], seen));
    }

    return parts.filter(Boolean).join('\n\n');
  }

  function serializeFromDom(root) {
    const seen = new Set();
    seen._registry = registry;
    return Array.from(root.children)
      .filter((el) => el.nodeType === 1)
      .map((el) => serializeNode(el, seen))
      .filter(Boolean)
      .join('\n\n');
  }

  return { toVisual, snapshotClean, toRaw, registry, hasBlocks };
}
