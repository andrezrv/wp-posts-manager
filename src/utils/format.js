/**
 * @file Formatting and sanitization utility functions.
 *
 * Pure functions for HTML escaping, text extraction, date formatting,
 * byte formatting, Base64 auth encoding, and image URL sanitization.
 * Used throughout the app for display and data preparation.
 */

const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape HTML special characters to prevent XSS. */
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => escMap[c]);
}

/** Strip HTML tags and collapse whitespace to produce plain text. */
export function plainText(html) {
  return (new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Format a date string for display (e.g. "Nov 16, 2026, 9:00 AM"). */
export function fmtDate(s) {
  const d = new Date(s);
  return isNaN(d) ? '' : dateFmt.format(d);
}

const pad = (n) => String(n).padStart(2, '0');

/** Format a Date to a `datetime-local` input value (YYYY-MM-DDTHH:MM). */
export function toLocalInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Format a Date to WordPress REST API date format (includes seconds). */
export function toWpDate(d) {
  return toLocalInput(d) + ':' + pad(d.getSeconds());
}

/** Format a byte count as a human-readable string (B, KB, or MB). */
export function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

/** Encode username and password as a Basic Auth header value. */
export function basicAuth(user, pass) {
  return 'Basic ' + btoa(unescape(encodeURIComponent(user + ':' + pass)));
}

/** Sanitize an image URL — allows http(s), data:image, and blob: only. */
export function safeImgSrc(url) {
  return /^(https?:|data:image\/|blob:)/i.test(String(url || '')) ? url : '';
}
