# WP Posts Manager

A standalone React application for managing WordPress posts through the REST API. Users can log in with WordPress credentials and list, create, update, and delete posts from a clean, responsive interface — without touching wp-admin.

## Features

- **Authentication** — log in with any WordPress user via JWT authentication (requires the JWT Authentication plugin)
- **Post management** — create, edit, and delete posts with title, content, excerpt, status, publish date, and featured image
- **Rich text editor** — TipTap-based WYSIWYG editor with bold, italic, headings, lists, blockquotes, links, and code blocks
- **Block preservation** — WordPress Gutenberg block markup is preserved through editing round-trips (see [Editor architecture](#editor-architecture))
- **Trash support** — soft-delete to trash with restore, or permanently delete
- **Status filtering** — filter by Published, Scheduled, Drafts, Pending, Private, or Trash with shareable URLs
- **Search** — full-text search with debounced input
- **Pagination** — server-side pagination respecting the site's posts-per-page setting
- **Dark mode** — system-aware theme with a manual light/dark/system toggle
- **Responsive** — works on desktop and mobile

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A WordPress site (5.6+) with:
  - [Application Passwords](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/) enabled
  - [JWT Authentication for WP REST API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/) plugin installed and configured (see plugin docs for `JWT_AUTH_SECRET_KEY` setup)

## Setup

```bash
# Install dependencies
npm install

# Copy the example environment file
cp .env.example .env
```

### Environment variables

Edit `.env` to configure the app:

| Variable | Default | Description |
|---|---|---|
| `VITE_WP_SITE_URL` | *(empty)* | WordPress site URL. When set, the login form hides the site address field. |
| `VITE_POSTS_PER_PAGE` | `10` | Fallback posts per page when WP settings endpoint is inaccessible. |
| `VITE_MAX_IMAGE_BYTES` | `5242880` | Maximum featured image file size in bytes (5 MB). |
| `VITE_ACCEPTED_IMAGE_TYPES` | `image/jpeg,image/png,image/gif,image/webp` | Comma-separated MIME types accepted for featured images. |
| `VITE_DEFAULT_POST_STATUS` | `draft` | Default status for new posts. |
| `VITE_DEBOUNCE_DELAY_MS` | `350` | Search input debounce delay in milliseconds. |
| `VITE_POSTS_ORDER_BY` | `date` | Post list sort field (`date`, `modified`, `title`). |
| `VITE_POSTS_ORDER` | `desc` | Post list sort direction (`asc`, `desc`). |
| `VITE_EXCERPT_PREVIEW_LENGTH` | `160` | Maximum characters shown in the post list excerpt preview. |
| `VITE_APP_NAME` | `Posts Manager` | Application name shown in the header and browser tab. |

Set `VITE_WP_SITE_URL` to your site's URL to pre-fill the login form. All other variables are optional — the app works with sensible defaults when they are unset.

## Running

### Development server

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). Vite provides hot module replacement — changes appear instantly without a full reload.

### Production build

```bash
npm run build
npm run preview
```

The build output goes to `dist/`. The `preview` command serves it locally for verification.

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

Tests use [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/) and jsdom. The test suite covers validation rules, API error handling, utility functions, the block parser, custom hooks, and component behavior.

## Linting and formatting

```bash
# Lint JavaScript and CSS
npm run lint

# Lint CSS only
npm run lint:css

# Format
npm run format
```

ESLint, Stylelint, and Prettier run automatically on staged files via a Husky pre-commit hook.

## Project structure

```
src/
├── api/              # REST API client and endpoint functions
├── auth/             # AuthContext provider and ProtectedRoute
├── components/       # Shared UI components (TopBar, Footer, Banner, etc.)
├── editor/           # Block parser, serializer, and bridge for WordPress blocks
├── hooks/            # Custom hooks (usePosts, usePostCounts, useDebounce)

├── pages/            # Route-level page components
├── styles/           # Global styles and CSS custom property tokens
├── utils/            # Formatting helpers (dates, HTML sanitization, etc.)
├── validation/       # Validation rules for login and post forms
├── App.jsx           # Root component with AuthProvider
├── Router.jsx        # Hash-based routes with lazy-loaded editor
└── main.jsx          # Entry point
```

## Editor architecture

The rich text editor preserves WordPress Gutenberg block markup (`<!-- wp:name -->` comment delimiters) through visual editing round-trips. Without this, blocks degrade to "Classic" blocks when reopened in the WordPress editor.

The system works in layers:

1. **Parse** — `blockParser.parseBlocks()` splits raw post content into a block tree following WordPress's comment-delimited format.
2. **Convert** — `blockBridge.toVisual()` turns simple blocks (paragraphs, headings, lists, quotes, preformatted) into editable HTML tagged with `data-wp-key`. Unsupported blocks become locked, read-only previews with an "edit in HTML mode" label.
3. **Registry** — each key maps to the original raw markup, so untouched blocks round-trip byte-for-byte.
4. **Serialize** — `blockSerializer.serializeVisual()` walks the DOM, re-wraps edited blocks with the correct `<!-- wp:... -->` comments, and returns original markup for anything unchanged.
5. **Classic content** — posts written with the classic editor (no block comments) pass through TipTap as plain HTML without the block layer.

Key files: `src/editor/blockParser.js`, `src/editor/blockSerializer.js`, `src/editor/blockBridge.js`, `src/components/RichEditor.jsx`.

## Tech stack

- [React](https://react.dev/) 19 with plain JavaScript (no TypeScript)
- [Vite](https://vite.dev/) 8 for bundling and development
- [React Router](https://reactrouter.com/) 7 with hash-based routing
- [TipTap](https://tiptap.dev/) for the rich text editor
- CSS Modules with global custom properties for theming
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) for tests
- [ESLint](https://eslint.org/) + [Stylelint](https://stylelint.io/) + [Prettier](https://prettier.io/) for code quality
- [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) for pre-commit hooks
