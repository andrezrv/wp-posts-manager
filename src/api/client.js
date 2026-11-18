/**
 * @file HTTP client for the WordPress REST API.
 *
 * Provides a thin wrapper around `fetch` that handles authentication,
 * JSON parsing, error mapping, and friendly error messages.
 *
 * Usage: call {@link configureClient} once at startup to set auth
 * credentials and site URL, then use {@link apiFetch} for all API
 * requests. The client detects 401 responses mid-session and triggers
 * the session-expired callback to auto-logout.
 */

import { ApiError, friendlyMessage } from './errors';

/** @type {string|null} Current Authorization header value. */
let sessionAuth = null;
let siteUrl = '';
let onSessionExpired = null;

/**
 * Configure the API client. Can be called multiple times to update
 * individual settings — only provided fields are changed.
 *
 * @param {object} opts
 * @param {string} [opts.auth] - Authorization header value.
 * @param {string} [opts.site] - WordPress site base URL.
 * @param {Function} [opts.onExpired] - Callback when a 401 invalidates the session.
 */
export function configureClient({ auth, site, onExpired }) {
  if (auth !== undefined) sessionAuth = auth;
  if (site !== undefined) siteUrl = site;
  if (onExpired !== undefined) onSessionExpired = onExpired;
}

export function getClientConfig() {
  return { auth: sessionAuth, siteUrl };
}

/**
 * Make an authenticated request to the WordPress REST API.
 *
 * Throws {@link ApiError} on network failures and HTTP error responses.
 *
 * @param {string} method - HTTP method (GET, POST, DELETE, etc.).
 * @param {string} path - API path relative to /wp-json (e.g. '/wp/v2/posts').
 * @param {object} [opts] - Request options.
 * @param {object} [opts.query] - URL query parameters.
 * @param {*} [opts.body] - Request body (object for JSON, File/Blob for uploads).
 * @param {object} [opts.headers] - Additional request headers.
 * @param {string} [opts.auth] - Override auth header for this request.
 * @returns {Promise<{status: number, headers: Headers, data: *}>}
 * @throws {ApiError}
 */
export async function apiFetch(method, path, opts = {}) {
  const { query, body, headers = {}, auth } = opts;

  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    });
  }
  const qs = params.toString();
  const url = '/wp-json' + path + (qs ? '?' + qs : '');

  const authHeader = auth || sessionAuth;
  const h = { ...headers };
  if (authHeader) h.Authorization = authHeader;

  let res;
  try {
    res = await remoteFetch(method, siteUrl + url, body, h);
  } catch (_e) {
    throw new ApiError(
      0,
      'network_error',
      "We couldn't reach the site. Check your connection and the site address.",
    );
  }

  if (res.status >= 400) {
    const d = res.data || {};
    const code = d.code || 'http_' + res.status;
    const err = new ApiError(
      res.status,
      code,
      friendlyMessage(res.status, code, d.message),
      d.data,
    );

    if (res.status === 401 && sessionAuth && !auth) {
      err.sessionEnded = true;
      if (onSessionExpired) {
        onSessionExpired('Your session token is no longer valid. Log in again to continue.');
      }
    }
    throw err;
  }

  return res;
}

/** Perform a real HTTP fetch and parse the JSON response. */
async function remoteFetch(method, url, body, headers) {
  const init = { method, headers: { Accept: 'application/json', ...headers } };

  if (body !== undefined) {
    if (body instanceof Blob || body instanceof File) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      init.headers['Content-Type'] = 'application/json';
    }
  }

  const r = await fetch(url, init);
  let data = null;
  try {
    data = await r.json();
  } catch (_) {
    /* non-JSON body */
  }

  return {
    status: r.status,
    headers: r.headers,
    data,
  };
}
