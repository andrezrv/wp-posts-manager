import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PostsPage from './pages/PostsPage';

const EditorPage = lazy(() => import('./pages/EditorPage'));

export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/posts',
            element: <PostsPage />,
          },
          {
            path: '/posts/new',
            element: <Suspense fallback={null}><EditorPage /></Suspense>,
          },
          {
            path: '/posts/:id/edit',
            element: <Suspense fallback={null}><EditorPage /></Suspense>,
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/posts" replace />,
      },
    ],
  },
]);
