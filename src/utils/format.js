const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => escMap[c]);
}

export function plainText(html) {
  return (new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function fmtDate(s) {
  const d = new Date(s);
  return isNaN(d) ? '' : dateFmt.format(d);
}

const pad = (n) => String(n).padStart(2, '0');

export function toLocalInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toWpDate(d) {
  return toLocalInput(d) + ':' + pad(d.getSeconds());
}

export function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export function basicAuth(user, pass) {
  return 'Basic ' + btoa(unescape(encodeURIComponent(user + ':' + pass)));
}

export function safeImgSrc(url) {
  return /^(https?:|data:image\/|blob:)/i.test(String(url || '')) ? url : '';
}
