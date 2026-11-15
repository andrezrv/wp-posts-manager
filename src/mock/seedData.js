import { esc } from '../utils/format';

export const users = [
  {
    id: 1,
    username: 'editor',
    email: 'mara@riverside-garden.test',
    name: 'Mara Okafor',
    slug: 'mara',
    roles: ['editor'],
    appPassword: 'Gd7k Qm2P xR9v Lw4s Tz6B nH3c',
    capabilities: {
      edit_posts: true,
      publish_posts: true,
      delete_posts: true,
      edit_others_posts: true,
      upload_files: true,
    },
  },
];

export const demoUser = users[0];

const STATUSES_LIST = ['publish', 'future', 'draft', 'pending', 'private'];

function art(n, c1, c2, c3) {
  const rows = [0, 1, 2, 3]
    .map(
      (i) =>
        `<rect x="-20" y="${226 + i * 44}" width="680" height="24" rx="12" fill="${c3}" opacity="${(0.28 + i * 0.14).toFixed(2)}"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/>${rows}<circle cx="${130 + ((n * 97) % 380)}" cy="${96 + ((n * 31) % 50)}" r="52" fill="#fff" opacity=".38"/></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const pad = (n) => String(n).padStart(2, '0');
function toWpDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const media = new Map();
let nextMediaId = 201;

function addMedia(source_url, mime, title) {
  const id = nextMediaId++;
  media.set(id, {
    id,
    source_url,
    mime_type: mime,
    title: { rendered: title },
    media_type: 'image',
    media_details: { sizes: {} },
  });
  return id;
}

const now = Date.now();
const DAY = 864e5;
function at(days, h = 9, m = 0) {
  const d = new Date(now + days * DAY);
  d.setHours(h, m, 0, 0);
  return d;
}

function makePost(id, f) {
  const slug = (f.title || 'post-' + id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return {
    id,
    date: f.date,
    date_gmt: new Date(f.date).toISOString().slice(0, 19),
    modified: f.modified || toWpDate(new Date()),
    slug,
    status: f.status,
    type: 'post',
    link: 'https://riverside-garden.test/' + slug + '/',
    author: 1,
    title: { raw: f.title, rendered: esc(f.title) },
    content: { raw: f.content, rendered: f.content, protected: false },
    excerpt: {
      raw: f.excerpt,
      rendered: f.excerpt ? '<p>' + esc(f.excerpt) + '</p>' : '',
      protected: false,
    },
    featured_media: f.featured_media || 0,
  };
}

const seed = [
  ['Spring planting schedule for the east beds', 'publish', -2, ['#4f8a3b', '#9cc56b', '#2f5a24'], '<p>Beds 1 through 12 open for planting this month.</p>', 'Beds 1 through 12 open for planting this month.'],
  ['Volunteer orientation moves to Saturday mornings', 'publish', -5, ['#2f6f8f', '#7fb6cf', '#1d4458'], '<p>Starting this month, orientation runs Saturdays at 9:00 by the tool shed.</p>', ''],
  ['How our three-bin compost system works', 'publish', -9, ['#7a5631', '#c49a62', '#4b3219'], '<p>Bin one takes fresh scraps, bin two is turning, bin three is ready to use.</p>', 'Fresh scraps, turning, ready to use.'],
  ['Tool shed hours for the summer season', 'future', 6, ['#b0702a', '#f0c070', '#7a4512'], '<p>From June the shed opens at 7:00 on weekdays.</p>', ''],
  ['Rain barrel workshop with the city water office', 'draft', -1, null, '<p>Draft: confirm date with the water office.</p>', ''],
  ['Plot waitlist update and how assignments work', 'pending', -3, null, '<p>We have 31 households on the waitlist.</p>', ''],
  ['Seed swap recap: 140 packets traded', 'publish', -16, ['#8a3b5c', '#d987a6', '#5a1f38'], '<p>Thanks to everyone who came out.</p>', ''],
  ['Board meeting notes, October', 'private', -20, null, '<p>Attendance, budget review and the irrigation repair quote.</p>', 'Members only.'],
  ['Harvest share table: what to bring, what to take', 'publish', -27, ['#5c6b2e', '#b9c36a', '#38421a'], '<p>Extra zucchini? Leave it on the share table.</p>', ''],
  ['Why we stopped using landscape fabric', 'draft', -6, null, '<p>Short version: it tears, it traps weeds, and it ends up in the landfill.</p>', ''],
  ['Welcome to the new garden website', 'publish', -40, ['#3b5c8a', '#8fb0dc', '#223a5c'], '<p>Schedules, plot information and news now live here.</p>', ''],
];

export const posts = new Map();
let nextPostId = 101;

seed.forEach(([title, status, days, colors, content, excerpt], i) => {
  const id = nextPostId++;
  const date = at(days, 8 + (i % 6), (i * 7) % 60);
  const featured = colors ? addMedia(art(i + 1, ...colors), 'image/svg+xml', title) : 0;
  posts.set(
    id,
    makePost(id, {
      title,
      status,
      date: toWpDate(date),
      content,
      excerpt,
      featured_media: featured,
      modified: toWpDate(status === 'draft' ? at(days, 17, 12) : date),
    }),
  );
});

let _nextPostId = nextPostId;
export function getNextPostId() {
  return _nextPostId++;
}

export { STATUSES_LIST, makePost, addMedia, toWpDate };
