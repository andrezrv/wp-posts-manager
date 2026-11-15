import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import usePosts from '../usePosts';

const mockPosts = [
  { id: 1, title: { raw: 'Post One' }, status: 'publish' },
  { id: 2, title: { raw: 'Post Two' }, status: 'draft' },
];

vi.mock('../../api/endpoints', () => ({
  listPosts: vi.fn(),
  deletePost: vi.fn(),
}));

import { listPosts, deletePost } from '../../api/endpoints';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePosts', () => {
  it('fetches posts and returns data', async () => {
    listPosts.mockResolvedValue({
      data: mockPosts,
      headers: {
        get: (key) => {
          if (key === 'X-WP-Total') return '2';
          if (key === 'X-WP-TotalPages') return '1';
          return null;
        },
      },
    });

    const { result } = renderHook(() =>
      usePosts({ page: 1, perPage: 8, search: '', status: 'any' }),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.posts).toEqual(mockPosts);
    expect(result.current.total).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    listPosts.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      usePosts({ page: 1, perPage: 8, search: '', status: 'any' }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.error.message).toBe('Network error');
    expect(result.current.posts).toEqual([]);
  });

  it('passes filters to listPosts', async () => {
    listPosts.mockResolvedValue({
      data: [],
      headers: { get: () => '0' },
    });

    renderHook(() => usePosts({ page: 2, perPage: 8, search: 'test', status: 'publish' }));

    await waitFor(() =>
      expect(listPosts).toHaveBeenCalledWith({
        page: 2,
        perPage: 8,
        search: 'test',
        status: 'publish',
      }),
    );
  });

  it('calls deletePost API', async () => {
    listPosts.mockResolvedValue({
      data: mockPosts,
      headers: { get: () => '2' },
    });
    deletePost.mockResolvedValue({});

    const { result } = renderHook(() =>
      usePosts({ page: 1, perPage: 8, search: '', status: 'any' }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.deletePost(1, false);
    expect(deletePost).toHaveBeenCalledWith(1, false);

    await result.current.deletePost(2, true);
    expect(deletePost).toHaveBeenCalledWith(2, true);
  });
});
