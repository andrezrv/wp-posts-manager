/**
 * @file Hook for fetching and managing the post list.
 *
 * Handles paginated post fetching with filter support (status, search,
 * page, perPage). Uses a token ref to discard stale responses when
 * filters change before a previous request completes.
 *
 * Also provides `deletePost` and `restorePost` actions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  listPosts,
  deletePost as apiDeletePost,
  updatePost as apiUpdatePost,
} from '../api/endpoints';

/**
 * Fetch and manage posts with filtering and pagination.
 *
 * @param {object} filters
 * @param {number} filters.page - Current page number.
 * @param {number} filters.perPage - Posts per page.
 * @param {string} filters.search - Search query.
 * @param {string} filters.status - Status filter key.
 * @returns {{ posts: Array, total: number, totalPages: number, loading: boolean, error: Error|null, refetch: Function, deletePost: Function, restorePost: Function }}
 */
export default function usePosts(filters) {
  const [data, setData] = useState({ posts: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenRef = useRef(0);

  const load = useCallback(async () => {
    const token = ++tokenRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await listPosts(filters);
      if (token !== tokenRef.current) return;

      setData({
        posts: res.data,
        total: Number(res.headers.get('X-WP-Total')) || 0,
        totalPages: Number(res.headers.get('X-WP-TotalPages')) || 0,
      });
    } catch (err) {
      if (token !== tokenRef.current) return;
      setError(err);
    } finally {
      if (token === tokenRef.current) setLoading(false);
    }
  }, [filters.page, filters.perPage, filters.search, filters.status]);

  useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch sets state after await
  }, [load]);

  const deletePost = useCallback(async (id, force) => {
    await apiDeletePost(id, force);
  }, []);

  const restorePost = useCallback(async (id) => {
    await apiUpdatePost(id, { status: 'draft' });
  }, []);

  return { ...data, loading, error, refetch: load, deletePost, restorePost };
}
