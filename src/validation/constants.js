/**
 * @file Shared constants and env-configurable settings.
 *
 * Central location for all values that may vary per deployment.
 * Each setting reads from a `VITE_*` environment variable with a
 * sensible fallback default. When no `.env` file is present, the
 * app behaves identically to the hardcoded defaults.
 */

/** Map of WordPress post status keys to display labels. */
export const STATUSES = {
  publish: 'Published',
  future: 'Scheduled',
  draft: 'Draft',
  pending: 'Pending review',
  private: 'Private',
  trash: 'Trash',
};

const rawImageTypes = (import.meta.env.VITE_ACCEPTED_IMAGE_TYPES || '').trim();

export const LIMITS = {
  title: 200,
  excerpt: 600,
  content: 100000,
  username: 60,
  imageBytes: Number(import.meta.env.VITE_MAX_IMAGE_BYTES) || 5 * 1024 * 1024,
};

export const IMAGE_TYPES = rawImageTypes
  ? rawImageTypes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const POSTS_PER_PAGE = Number(import.meta.env.VITE_POSTS_PER_PAGE) || 10;

export const EXCERPT_PREVIEW_LENGTH = Number(import.meta.env.VITE_EXCERPT_PREVIEW_LENGTH) || 160;

const envStatus = import.meta.env.VITE_DEFAULT_POST_STATUS;
export const DEFAULT_POST_STATUS =
  envStatus && envStatus !== 'trash' && STATUSES[envStatus] ? envStatus : 'draft';

export const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
