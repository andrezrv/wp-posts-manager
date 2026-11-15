import { apiFetch } from './client';

export function verifyLogin(auth) {
  return apiFetch('GET', '/wp/v2/users/me', { query: { context: 'edit' }, auth });
}

export function listPosts({ page, perPage, search, status }) {
  return apiFetch('GET', '/wp/v2/posts', {
    query: {
      context: 'edit',
      page,
      per_page: perPage,
      search,
      orderby: 'date',
      order: 'desc',
      status: status === 'any' ? 'publish,future,draft,pending,private' : status,
      _embed: 'wp:featuredmedia',
    },
  });
}

export function getPost(id) {
  return apiFetch('GET', '/wp/v2/posts/' + id, {
    query: { context: 'edit', _embed: 'wp:featuredmedia' },
  });
}

export function createPost(data) {
  return apiFetch('POST', '/wp/v2/posts', { body: data });
}

export function updatePost(id, data) {
  return apiFetch('POST', '/wp/v2/posts/' + id, { body: data });
}

export function deletePost(id, force) {
  return apiFetch('DELETE', '/wp/v2/posts/' + id, {
    query: force ? { force: 'true' } : undefined,
  });
}

export function getSettings() {
  return apiFetch('GET', '/wp/v2/settings');
}

const COUNT_STATUSES = ['publish', 'future', 'draft', 'pending', 'private', 'trash'];

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

export function uploadMedia(file) {
  return apiFetch('POST', '/wp/v2/media', {
    body: file,
    headers: {
      'Content-Type': file.type,
      'Content-Disposition': 'attachment; filename="' + file.name.replace(/[^\w.\-]+/g, '-') + '"',
    },
  });
}
