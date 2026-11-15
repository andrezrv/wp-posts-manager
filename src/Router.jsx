import { createHashRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PostsPage from './pages/PostsPage';

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
        ],
      },
      {
        path: '*',
        element: <Navigate to="/posts" replace />,
      },
    ],
  },
]);
