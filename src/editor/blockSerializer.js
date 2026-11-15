import { esc } from '../utils/format';

const escAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const escText = (s) => esc(s);

const wrapBlock = (short, attrsStr, inner) =>
  `<!-- wp:${short}${attrsStr ? ' ' + attrsStr : ''} -->\n${inner}\n<!-- /wp:${short} -->`;

function parseBody(html) {
  return new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html').body;
}

function isBlank(el) {
  return !el.textContent.trim() && !el.querySelector('img,video,audio,iframe,hr');
}

function hasContent(html) {
  return !isBlank(parseBody(html));
}

export function cleanOuter(el) {
  const c = el.cloneNode(true);
  c.removeAttribute('data-wp-key');
  c.querySelectorAll('[data-wp-key]').forEach((x) => x.removeAttribute('data-wp-key'));
  return c.outerHTML;
}

function innerClean(el) {
  const c = el.cloneNode(true);
  c.querySelectorAll('[data-wp-key]').forEach((x) => x.removeAttribute('data-wp-key'));
  return c.innerHTML;
}

function openTag(tag, el, ensureClass) {
  let cls = el ? el.getAttribute('class') || '' : '';
  if (ensureClass && !cls.split(/\s+/).includes(ensureClass))
    cls = (ensureClass + ' ' + cls).trim();
  const parts = cls ? [`class="${escAttr(cls)}"`] : [];
  if (el)
    Array.from(el.attributes).forEach((a) => {
      if (!['class', 'data-wp-key', 'contenteditable'].includes(a.name))
        parts.push(`${a.name}="${escAttr(a.value)}"`);
    });
  return `<${tag}${parts.length ? ' ' + parts.join(' ') : ''}>`;
}

const TOP_BLOCK_TAGS = /^(P|H[1-6]|UL|OL|BLOCKQUOTE|PRE|HR|DIV|FIGURE|TABLE|SECTION|DL)$/;

function serializeList(el, meta) {
  const tag = el.tagName.toLowerCase();
  const attrsStr = meta ? meta.attrsStr : tag === 'ol' ? '{"ordered":true}' : '';
  const items = Array.from(el.children)
    .filter((c) => c.tagName === 'LI')
    .map((li) => {
      let html = '';
      li.childNodes.forEach((n) => {
        if (n.nodeType === 1 && /^(UL|OL)$/.test(n.tagName)) html += serializeList(n, null);
        else if (n.nodeType === 1) html += cleanOuter(n);
        else if (n.nodeType === 3) html += escText(n.textContent);
      });
      return wrapBlock('list-item', '', `<li>${html}</li>`);
    })
    .join('\n\n');
  return wrapBlock(
    meta ? meta.short : 'list',
    attrsStr,
    `${openTag(tag, meta ? el : null, 'wp-block-list')}${items}</${tag}>`,
  );
}

function serializeQuote(el, meta, seen) {
  const kids = [];
  let inline = '';
  const flush = () => {
    if (hasContent(inline)) kids.push(wrapBlock('paragraph', '', `<p>${inline.trim()}</p>`));
    inline = '';
  };
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      inline += escText(n.textContent);
      return;
    }
    if (n.nodeType !== 1) return;
    if (n.tagName === 'CITE') {
      flush();
      kids.push(cleanOuter(n));
      return;
    }
    if (!TOP_BLOCK_TAGS.test(n.tagName)) {
      inline += cleanOuter(n);
      return;
    }
    flush();
    const s =
      n.tagName === 'P'
        ? isBlank(n)
          ? ''
          : wrapBlock('paragraph', '', `<p>${innerClean(n)}</p>`)
        : serializeNode(n, seen);
    if (s) kids.push(s);
  });
  flush();
  if (!kids.length) return '';
  return wrapBlock(
    meta ? meta.short : 'quote',
    meta ? meta.attrsStr : '',
    `${openTag('blockquote', meta ? el : null, 'wp-block-quote')}${kids.join('\n\n')}</blockquote>`,
  );
}

export function serializeNode(el, seen) {
  const key = el.getAttribute('data-wp-key');
  let meta = key ? seen._registry.get(key) || null : null;
  if (key && seen.has(key)) meta = null;
  if (key) seen.add(key);

  if (meta && meta.kind === 'locked') return meta.raw;
  if (el.classList && el.classList.contains('wp-locked')) return '';
  if (meta && meta.tag !== el.tagName) meta = null;

  const tag = el.tagName;
  const lower = tag.toLowerCase();

  if (meta) {
    if (cleanOuter(el) === meta.clean) return meta.raw;
    if (meta.kind === 'simple')
      return isBlank(el) ? '' : wrapBlock(meta.short, meta.attrsStr, cleanOuter(el));
    if (meta.kind === 'list') return serializeList(el, meta);
    if (meta.kind === 'quote') return serializeQuote(el, meta, seen);
  }

  if (/^(P|H[1-6]|PRE)$/.test(tag) && isBlank(el)) return '';
  const inner = innerClean(el);

  if (tag === 'P') return wrapBlock('paragraph', '', `<p>${inner}</p>`);
  if (/^H[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    return wrapBlock(
      'heading',
      level === 2 ? '' : JSON.stringify({ level }),
      `<${lower} class="wp-block-heading">${inner}</${lower}>`,
    );
  }
  if (tag === 'PRE')
    return wrapBlock('preformatted', '', `<pre class="wp-block-preformatted">${inner}</pre>`);
  if (tag === 'UL' || tag === 'OL') return serializeList(el, null);
  if (tag === 'BLOCKQUOTE') return serializeQuote(el, null, seen);
  if (tag === 'HR')
    return wrapBlock(
      'separator',
      '',
      '<hr class="wp-block-separator has-alpha-channel-opacity"/>',
    );
  return wrapBlock('html', '', cleanOuter(el));
}

export function serializeVisual(root, registry) {
  const seen = new Set();
  seen._registry = registry;
  const parts = [];
  let inline = '';

  const flush = () => {
    if (hasContent(inline))
      parts.push(wrapBlock('paragraph', '', `<p>${inline.trim()}</p>`));
    inline = '';
  };

  root.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      inline += escText(n.textContent);
      return;
    }
    if (n.nodeType !== 1) return;
    if (!TOP_BLOCK_TAGS.test(n.tagName)) {
      inline += cleanOuter(n);
      return;
    }
    flush();
    const s = serializeNode(n, seen);
    if (s) parts.push(s);
  });
  flush();
  return parts.join('\n\n');
}
