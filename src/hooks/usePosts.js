import { useState, useEffect, useCallback, useRef } from 'react';
import { listPosts, deletePost as apiDeletePost } from '../api/endpoints';

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
    load();
  }, [load]);

  const deletePost = useCallback(async (id, force) => {
    await apiDeletePost(id, force);
  }, []);

  return { ...data, loading, error, refetch: load, deletePost };
}
