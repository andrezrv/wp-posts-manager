const BLOCK_TOKEN =
  /<!--\s+(\/)?wp:([a-z][a-z0-9_-]*(?:\/[a-z][a-z0-9_-]*)?)\s+(\{[\s\S]*?\}\s+)?(\/)?-->/g;

export function hasBlocks(s) {
  return /<!--\s+\/?wp:[a-z]/.test(String(s || ''));
}

function safeJson(s) {
  if (!s) return {};
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? v : null;
  } catch (_) {
    return null;
  }
}

export function parseBlocks(src) {
  src = String(src || '');
  const out = [];
  const stack = [];
  const re = new RegExp(BLOCK_TOKEN.source, 'g');
  let last = 0;

  const free = (s) => {
    if (s.trim()) out.push({ type: 'freeform', raw: s.trim() });
  };

  const attach = (b) => {
    if (stack.length) {
      stack[stack.length - 1].children.push(b);
    } else {
      out.push(b);
      last = b.end;
    }
  };

  let m;
  while ((m = re.exec(src))) {
    const [tok, closer, rawName, attrsRaw, self] = m;
    const name = rawName.includes('/') ? rawName : 'core/' + rawName;

    if (!stack.length && m.index > last) free(src.slice(last, m.index));

    if (closer) {
      const b = stack.pop();
      if (!b || b.name !== name) return null;
      b.innerRaw = src.slice(b.innerStart, m.index);
      b.end = re.lastIndex;
      b.raw = src.slice(b.start, b.end);
      attach(b);
    } else {
      const b = {
        type: 'block',
        name,
        short: rawName,
        attrsStr: attrsRaw ? attrsRaw.trim() : '',
        attrs: safeJson(attrsRaw && attrsRaw.trim()),
        start: m.index,
        innerStart: re.lastIndex,
        children: [],
      };
      if (self) {
        b.innerRaw = '';
        b.end = re.lastIndex;
        b.raw = tok;
        attach(b);
      } else {
        stack.push(b);
      }
    }
  }

  if (stack.length) return null;
  if (last < src.length) free(src.slice(last));
  return out;
}
