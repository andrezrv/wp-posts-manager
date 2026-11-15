import { createHashRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PostsPage from './pages/PostsPage';
import EditorPage from './pages/EditorPage';

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
            element: <EditorPage />,
          },
          {
            path: '/posts/:id/edit',
            element: <EditorPage />,
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
