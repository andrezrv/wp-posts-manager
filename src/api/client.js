import { ApiError, friendlyMessage } from './errors';

let sessionAuth = null;
let siteUrl = '';
let useMock = false;
let onSessionExpired = null;
let mockHandler = null;

export function configureClient({ auth, site, onExpired, mock, mode }) {
  if (auth !== undefined) sessionAuth = auth;
  if (site !== undefined) siteUrl = site;
  if (onExpired !== undefined) onSessionExpired = onExpired;
  if (mock !== undefined) mockHandler = mock;
  if (mode !== undefined) useMock = mode === 'mock';
}

export function getClientConfig() {
  return { auth: sessionAuth, siteUrl, useMock };
}

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
    if (useMock && mockHandler) {
      res = await mockHandler(method, url, body, h);
    } else {
      res = await remoteFetch(method, siteUrl + url, body, h);
    }
  } catch (e) {
    throw new ApiError(
      0,
      'network_error',
      "We couldn't reach the site. Check your connection and the site address.",
    );
  }

  if (res.status >= 400) {
    const d = res.data || {};
    const code = d.code || 'http_' + res.status;
    const err = new ApiError(res.status, code, friendlyMessage(res.status, code, d.message), d.data);

    if (res.status === 401 && sessionAuth && !auth) {
      err.sessionEnded = true;
      if (onSessionExpired) {
        onSessionExpired(
          'Your session ended because WordPress no longer accepts these credentials. The Application Password may have been revoked. Log in again to continue.',
        );
      }
    }
    throw err;
  }

  return res;
}

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
