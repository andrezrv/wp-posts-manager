/**
 * @file Root application component.
 *
 * Composes the two top-level providers that every route needs:
 *
 * 1. **AuthProvider** — supplies session state (login, logout,
 *    credentials) to the entire component tree via React context.
 * 2. **RouterProvider** — connects the hash-based router defined in
 *    Router.jsx, enabling client-side navigation without a server.
 *
 * This component is intentionally thin — it owns no state and renders
 * no UI of its own. All layout, routing, and authentication logic
 * lives in the providers and their children.
 */

import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { router } from './Router';

/**
 * Root component that wraps the router in the authentication provider.
 *
 * @returns {JSX.Element} The provider-wrapped application.
 */
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
