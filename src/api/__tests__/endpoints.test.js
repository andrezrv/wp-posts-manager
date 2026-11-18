/** @file Tests for JWT token endpoint functions. */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('../client', () => ({
  apiFetch: vi.fn(),
}));

import { obtainToken, validateToken } from '../endpoints';
import { apiFetch } from '../client';

describe('obtainToken', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns token data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          token: 'jwt123',
          user_email: 'a@b.com',
          user_nicename: 'admin',
          user_display_name: 'Admin',
        }),
    });
    const result = await obtainToken('https://example.com', 'admin', 'pass');
    expect(result.token).toBe('jwt123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/wp-json/jwt-auth/v1/token',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws friendly message on 403 (wrong credentials)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ code: 'jwt_auth_failed', message: 'Invalid credentials.' }),
    });
    await expect(obtainToken('https://example.com', 'admin', 'wrong')).rejects.toThrow(
      /username or Application Password/i,
    );
  });

  it('throws friendly message on 404 (plugin not installed)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ code: 'rest_no_route' }),
    });
    await expect(obtainToken('https://example.com', 'admin', 'pass')).rejects.toThrow(
      /JWT authentication is not available/i,
    );
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(obtainToken('https://example.com', 'admin', 'pass')).rejects.toThrow(
      /couldn.t reach the site/i,
    );
  });

  it('throws when response is 200 but token field is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user_email: 'a@b.com' }),
    });
    await expect(obtainToken('https://example.com', 'admin', 'pass')).rejects.toThrow();
  });

  it('throws friendly message when error response is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    });
    await expect(obtainToken('https://example.com', 'admin', 'pass')).rejects.toThrow();
  });

  it('throws friendly message when success response is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    });
    await expect(obtainToken('https://example.com', 'admin', 'pass')).rejects.toThrow(
      /unexpected response/i,
    );
  });
});

describe('validateToken', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns true when token is valid', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: { code: 'jwt_auth_valid_token' } });
    expect(await validateToken()).toBe(true);
  });

  it('returns false when token is expired/invalid', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('expired'));
    expect(await validateToken()).toBe(false);
  });
});
