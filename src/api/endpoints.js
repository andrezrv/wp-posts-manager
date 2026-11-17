/**
 * @file WordPress REST API endpoint functions.
 *
 * Each exported function maps to a specific WordPress REST API
 * endpoint, handling URL construction, query parameters, and request
 * body formatting. All functions return the response from
 * {@link apiFetch}, which includes status, headers, and parsed data.
 *
 * Sort order for post listings is configurable via `VITE_POSTS_ORDER_BY`
 * and `VITE_POSTS_ORDER` environment variables.
 */

import { apiFetch } from './client';

/** Post list sort field, configurable via env var. */
const POSTS_ORDER_BY = import.meta.env.VITE_POSTS_ORDER_BY || 'date';

/** Post list sort direction, configurable via env var. */
const POSTS_ORDER = import.meta.env.VITE_POSTS_ORDER || 'desc';

/** Verify credentials and fetch the current user's profile. */
export function verifyLogin(auth) {
  return apiFetch('GET', '/wp/v2/users/me', { query: { context: 'edit' }, auth });
}

/** Fetch a paginated, filtered list of posts with embedded featured media. */
export function listPosts({ page, perPage, search, status }) {
  return apiFetch('GET', '/wp/v2/posts', {
    query: {
      context: 'edit',
      page,
      per_page: perPage,
      search,
      orderby: POSTS_ORDER_BY,
      order: POSTS_ORDER,
      status: status === 'any' ? 'publish,future,draft,pending,private' : status,
      _embed: 'wp:featuredmedia',
    },
  });
}

/** Fetch a single post by ID with embedded featured media. */
export function getPost(id) {
  return apiFetch('GET', '/wp/v2/posts/' + id, {
    query: { context: 'edit', _embed: 'wp:featuredmedia' },
  });
}

/** Create a new post. */
export function createPost(data) {
  return apiFetch('POST', '/wp/v2/posts', { body: data });
}

/** Update an existing post by ID. */
export function updatePost(id, data) {
  return apiFetch('POST', '/wp/v2/posts/' + id, { body: data });
}

/** Delete a post. When `force` is true, bypasses the trash. */
export function deletePost(id, force) {
  return apiFetch('DELETE', '/wp/v2/posts/' + id, {
    query: force ? { force: 'true' } : undefined,
  });
}

/** Fetch site settings (used for posts_per_page). */
export function getSettings() {
  return apiFetch('GET', '/wp/v2/settings');
}

/** Statuses to count in the tab badges. */
const COUNT_STATUSES = ['publish', 'future', 'draft', 'pending', 'private', 'trash'];

/** Fetch post counts per status by reading X-WP-Total headers. */
export async function getPostCounts() {
  const results = await Promise.all(
    COUNT_STATUSES.map((s) =>
      apiFetch('GET', '/wp/v2/posts', { query: { status: s, per_page: 1, context: 'edit' } }),
    ),
  );
  const counts = {};
  COUNT_STATUSES.forEach((s, i) => {
    counts[s] = Number(results[i].headers.get('X-WP-Total')) || 0;
  });
  return counts;
}

/** Upload an image file to the WordPress media library. */
export function uploadMedia(file) {
  return apiFetch('POST', '/wp/v2/media', {
    body: file,
    headers: {
      'Content-Type': file.type,
      'Content-Disposition': 'attachment; filename="' + file.name.replace(/[^\w.\-]+/g, '-') + '"',
    },
  });
}
