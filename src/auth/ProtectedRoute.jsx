/**
 * @file Route guard for authenticated pages.
 *
 * Wraps protected routes and redirects unauthenticated users to the
 * login page. Authenticated users see the child routes via `<Outlet>`.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Renders child routes if the user is authenticated, otherwise
 * redirects to `/login`.
 *
 * @returns {JSX.Element} Either a `<Navigate>` redirect or an `<Outlet>`.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
