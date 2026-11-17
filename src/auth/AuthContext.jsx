/**
 * @file Authentication context and provider.
 *
 * Manages the user's session lifecycle — login, logout, persistence,
 * and cross-tab synchronization. The session is stored in localStorage
 * so it survives page reloads and new tabs.
 *
 * Exports:
 * - {@link AuthProvider} — context provider that wraps the app.
 * - {@link useAuth} — hook to access session state and auth actions.
 *
 * On login, credentials are verified against the WordPress REST API
 * (`/wp/v2/users/me`). The user must have `edit_posts` capability.
 * Optionally fetches the site's posts-per-page setting from
 * `/wp/v2/settings` (skipped when `VITE_POSTS_PER_PAGE` is set).
 *
 * If the API returns 401 during a session (e.g. revoked Application
 * Password), the session is cleared and a notice is shown on the
 * login page.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { configureClient } from '../api/client';
import { verifyLogin, getSettings } from '../api/endpoints';
import { basicAuth } from '../utils/format';
import { POSTS_PER_PAGE } from '../validation/constants';

/** @constant {string} localStorage key for the serialized session. */
const SESSION_KEY = 'wp_posts_manager_session';
const AuthContext = createContext(null);

/** Persist session to localStorage. Silently fails if storage is full or blocked. */
function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (_) {
    /* storage full or blocked */
  }
}

/** Load session from localStorage. Returns null if absent or unparseable. */
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/** Remove session from localStorage. */
function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (_) {
    /* blocked */
  }
}

/**
 * Provides authentication state and actions to the component tree.
 *
 * On mount, restores a saved session from localStorage and configures
 * the API client. Listens for `storage` events to sync login/logout
 * across browser tabs.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());
  const [loginNotice, setLoginNotice] = useState(null);
  const sessionRef = useRef(session);

  useEffect(() => {
    configureClient({
      onExpired: (message) => {
        sessionRef.current = null;
        setSession(null);
        clearSession();
        setLoginNotice(message);
        configureClient({ auth: null, site: '' });
      },
    });

    if (session) {
      configureClient({ auth: session.auth, site: session.siteUrl });
    }

    const onStorage = (e) => {
      if (e.key !== SESSION_KEY) return;
      const next = e.newValue ? JSON.parse(e.newValue) : null;
      sessionRef.current = next;
      setSession(next);
      if (next) {
        configureClient({ auth: next.auth, site: next.siteUrl });
      } else {
        configureClient({ auth: null, site: '' });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- runs once on mount; session is read via ref

  const login = useCallback(async (siteUrl, username, password) => {
    const auth = basicAuth(username, password);
    const site = siteUrl.replace(/\/+$/, '');

    configureClient({ auth, site });

    const res = await verifyLogin(auth);
    const user = res.data;

    if (!user.capabilities || !user.capabilities.edit_posts) {
      configureClient({ auth: null, site: '' });
      throw new Error(
        "This account can't edit posts. Log in with an Author, Editor, or Administrator account.",
      );
    }

    let postsPerPage = POSTS_PER_PAGE;
    if (!import.meta.env.VITE_POSTS_PER_PAGE) {
      try {
        const settingsRes = await getSettings();
        if (settingsRes.data?.posts_per_page) {
          postsPerPage = settingsRes.data.posts_per_page;
        }
      } catch (_) {
        /* settings endpoint may not be accessible — use default */
      }
    }

    const s = { auth, user, siteUrl: site, postsPerPage };
    sessionRef.current = s;
    setSession(s);
    saveSession(s);
    setLoginNotice(null);
  }, []);

  const logout = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
    clearSession();
    setLoginNotice(null);
    configureClient({ auth: null, site: '' });
  }, []);

  const clearLoginNotice = useCallback(() => setLoginNotice(null), []);

  const value = {
    session,
    loginNotice,
    clearLoginNotice,
    isAuthenticated: !!session,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the authentication context.
 *
 * @returns {{ session: object|null, loginNotice: string|null, clearLoginNotice: Function, isAuthenticated: boolean, login: Function, logout: Function }}
 * @throws {Error} If called outside of {@link AuthProvider}.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
