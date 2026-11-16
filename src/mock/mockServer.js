import { users, posts, media, STATUSES_LIST, makePost, addMedia, toWpDate, getNextPostId } from './seedData';

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

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function withEmbed(p, q) {
  const out = clone(p);
  if (q.has('_embed') && p.featured_media && media.has(p.featured_media)) {
    out._embedded = { 'wp:featuredmedia': [clone(media.get(p.featured_media))] };
  }
  return out;
}

export async function handle(method, url, body, headers) {
  await sleep(200 + Math.random() * 200);

  const u = new URL(url, 'https://riverside-garden.test');
  const path = u.pathname.replace(/^\/wp-json/, '');
  const q = u.searchParams;
  const a = authenticate(headers.Authorization);
  if (a.error) return a.error;
  const user = a.user;

  // GET /wp/v2/users/me
  if (path === '/wp/v2/users/me' && method === 'GET') {
    if (!user) return fail(401, 'rest_not_logged_in', 'You are not currently logged in.');
    const { appPassword: _pwd, ...pub } = user;
    return reply(200, clone(pub));
  }

  // GET /wp/v2/settings
  if (path === '/wp/v2/settings' && method === 'GET') {
    if (!user) return fail(401, 'rest_not_logged_in', 'You are not currently logged in.');
    return reply(200, { posts_per_page: 10 });
  }

  // POST /wp/v2/posts (create)
  if (path === '/wp/v2/posts' && method === 'POST') {
    if (!user) return fail(401, 'rest_cannot_create', 'Sorry, you are not allowed to create posts.');
    if (!body || !body.title) return fail(400, 'rest_invalid_param', 'Missing required parameter: title');

    const id = getNextPostId();
    const now = toWpDate(new Date());
    const post = makePost(id, {
      title: body.title,
      status: body.status || 'draft',
      date: body.date || now,
      content: body.content || '',
      excerpt: body.excerpt || '',
      featured_media: body.featured_media || 0,
      modified: now,
    });
    posts.set(id, post);
    return reply(201, withEmbed(post, new URLSearchParams()));
  }

  // POST /wp/v2/media (upload)
  if (path === '/wp/v2/media' && method === 'POST') {
    if (!user) return fail(401, 'rest_cannot_create', 'Sorry, you are not allowed to upload media.');
    const disposition = headers['Content-Disposition'] || '';
    const nameMatch = disposition.match(/filename="([^"]+)"/);
    const filename = nameMatch ? nameMatch[1] : 'upload.jpg';
    const mime = headers['Content-Type'] || 'image/jpeg';
    const mediaId = addMedia('data:' + mime + ';base64,placeholder', mime, filename);
    return reply(201, clone(media.get(mediaId)));
  }

  // GET /wp/v2/posts
  if (path === '/wp/v2/posts' && method === 'GET') {
    if (q.get('context') === 'edit' && !user) {
      return fail(401, 'rest_forbidden_context', 'Sorry, you are not allowed to edit posts.');
    }

    const statuses = (q.get('status') || 'publish').split(',');
    const bad = statuses.find((s) => !STATUSES_LIST.includes(s) && s !== 'trash');
    if (bad) {
      return fail(400, 'rest_invalid_param', 'Invalid parameter(s): status', {
        params: { status: 'status is not one of publish, future, draft, pending, private, trash.' },
      });
    }

    const search = (q.get('search') || '').toLowerCase();
    let list = [...posts.values()].filter((p) => statuses.includes(p.status));
    if (search) {
      list = list.filter(
        (p) =>
          (p.title.raw + ' ' + p.content.raw + ' ' + p.excerpt.raw).toLowerCase().includes(search),
      );
    }
    list.sort((x, y) => new Date(y.date) - new Date(x.date));

    const per = Math.min(100, Math.max(1, Number(q.get('per_page')) || 10));
    const page = Math.max(1, Number(q.get('page')) || 1);
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / per));

    if (page > totalPages && total > 0) {
      return fail(
        400,
        'rest_post_invalid_page_number',
        'The page number requested is larger than the number of pages available.',
      );
    }

    return reply(
      200,
      list.slice((page - 1) * per, page * per).map((p) => withEmbed(p, q)),
      { 'X-WP-Total': total, 'X-WP-TotalPages': totalPages },
    );
  }

  // GET/POST/DELETE /wp/v2/posts/:id
  const postMatch = path.match(/^\/wp\/v2\/posts\/(\d+)$/);
  if (postMatch) {
    const id = Number(postMatch[1]);
    const post = posts.get(id);
    if (!post) return fail(404, 'rest_post_invalid_id', 'Invalid post ID.');

    if (method === 'GET') {
      if (q.get('context') === 'edit' && !user) {
        return fail(401, 'rest_forbidden_context', 'Sorry, you are not allowed to edit this post.');
      }
      return reply(200, withEmbed(post, q));
    }

    if (method === 'POST') {
      if (!user) return fail(401, 'rest_cannot_edit', 'Sorry, you are not allowed to edit this post.');
      if (body.title !== undefined) {
        post.title.raw = body.title;
        post.title.rendered = body.title;
      }
      if (body.content !== undefined) {
        post.content.raw = body.content;
        post.content.rendered = body.content;
      }
      if (body.excerpt !== undefined) {
        post.excerpt.raw = body.excerpt;
        post.excerpt.rendered = body.excerpt ? '<p>' + body.excerpt + '</p>' : '';
      }
      if (body.status !== undefined) post.status = body.status;
      if (body.date !== undefined) post.date = body.date;
      if (body.featured_media !== undefined) post.featured_media = body.featured_media;
      post.modified = toWpDate(new Date());
      return reply(200, withEmbed(post, q));
    }

    if (method === 'DELETE') {
      if (!user) return fail(401, 'rest_cannot_delete', 'Sorry, you are not allowed to delete this post.');
      if (q.get('force') === 'true') {
        posts.delete(id);
        return reply(200, { deleted: true, previous: clone(post) });
      }
      if (post.status === 'trash') return fail(410, 'rest_already_trashed', 'The post has already been deleted.');
      post.status = 'trash';
      return reply(200, clone(post));
    }
  }

  return fail(404, 'rest_no_route', 'No route was found matching the URL and request method.');
}
