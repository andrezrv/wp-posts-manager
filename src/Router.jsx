/**
 * @file Application route definitions.
 *
 * Uses hash-based routing (`createHashRouter`) so the app can be served
 * as a static file without server-side URL rewriting — all routes live
 * after the `#` (e.g. `/#/posts`, `/#/posts/new`).
 *
 * Route structure:
 *
 * - `/login` — public, renders the login form.
 * - `/posts` — protected, lists all posts with filtering and search.
 * - `/posts/new` — protected, creates a new post.
 * - `/posts/:id/edit` — protected, edits an existing post.
 * - `*` — catch-all, redirects to `/posts`.
 *
 * All routes share the {@link AppLayout} wrapper (top bar, main area,
 * footer). Protected routes are wrapped in {@link ProtectedRoute},
 * which redirects unauthenticated users to `/login`.
 *
 * The editor page is lazy-loaded with `React.lazy()` to keep TipTap
 * and its dependencies out of the initial bundle, reducing first-load
 * size for users who only need the post list.
 */

import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PostsPage from './pages/PostsPage';

/** Lazy-loaded editor page — splits TipTap into a separate chunk. */
const EditorPage = lazy(() => import('./pages/EditorPage'));

/**
 * The application's hash-based router instance.
 *
 * Exported so {@link App} can pass it to `RouterProvider`.
 *
 * @see {@link https://reactrouter.com/en/main/routers/create-hash-router}
 */
export const router = createHashRouter([
  {
    // Shared layout: TopBar + main content area + Footer.
    element: <AppLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        // All routes below require an authenticated session.
        element: <ProtectedRoute />,
        children: [
          {
            path: '/posts',
            element: <PostsPage />,
          },
          {
            path: '/posts/new',
            element: (
              <Suspense fallback={null}>
                <EditorPage />
              </Suspense>
            ),
          },
          {
            path: '/posts/:id/edit',
            element: (
              <Suspense fallback={null}>
                <EditorPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        // Catch-all: redirect unknown paths to the post list.
        path: '*',
        element: <Navigate to="/posts" replace />,
      },
    ],
  },
]);
