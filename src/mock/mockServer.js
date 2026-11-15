import { users } from './seedData';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function authenticate(header) {
  if (!header) return { user: null };

  const m = /^Basic\s+(.+)$/i.exec(header);
  if (!m) return { error: fail(401, 'rest_not_logged_in', 'You are not currently logged in.') };

  let decoded;
  try {
    decoded = decodeURIComponent(escape(atob(m[1])));
  } catch (_) {
    return { error: fail(401, 'rest_not_logged_in', 'Malformed credentials.') };
  }

  const i = decoded.indexOf(':');
  const login = decoded.slice(0, i).toLowerCase();
  const pass = decoded.slice(i + 1).replace(/[^a-z\d]/gi, '');

  const user = users.find((u) => u.username === login || u.email === login);
  if (!user) return { error: fail(401, 'invalid_username', 'Unknown username.') };
  if (user.appPassword.replace(/\s/g, '') !== pass) {
    return {
      error: fail(
        401,
        'incorrect_password',
        'The provided password is an invalid application password.',
      ),
    };
  }

  return { user };
}

function reply(status, data, headers = {}) {
  return {
    status,
    data,
    headers: { get: (k) => (headers[k] !== undefined ? String(headers[k]) : null) },
  };
}

function fail(status, code, message, data) {
  return reply(status, {
    code,
    message,
    data: Object.assign({ status }, data || {}),
  });
}

export async function handle(method, url, body, headers) {
  await sleep(200 + Math.random() * 200);

  const u = new URL(url, 'https://riverside-garden.test');
  const path = u.pathname.replace(/^\/wp-json/, '');
  const a = authenticate(headers.Authorization);
  if (a.error) return a.error;
  const user = a.user;

  if (path === '/wp/v2/users/me' && method === 'GET') {
    if (!user) return fail(401, 'rest_not_logged_in', 'You are not currently logged in.');
    const { appPassword, ...pub } = user;
    return reply(200, structuredClone(pub));
  }

  return fail(404, 'rest_no_route', 'No route was found matching the URL and request method.');
}
