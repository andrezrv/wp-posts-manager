import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { configureClient } from '../api/client';
import { verifyLogin, getSettings } from '../api/endpoints';
import { basicAuth } from '../utils/format';
import { handle as mockHandle } from '../mock/mockServer';

const SESSION_KEY = 'wp_posts_manager_session';
const AuthContext = createContext(null);

function saveSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (_) {
    /* storage full or blocked */
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (_) {
    /* blocked */
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());
  const [loginNotice, setLoginNotice] = useState(null);
  const sessionRef = useRef(session);

  useEffect(() => {
    const mock = import.meta.env.VITE_MOCK_ENABLED === 'true' ? mockHandle : null;
    configureClient({
      mock,
      onExpired: (message) => {
        sessionRef.current = null;
        setSession(null);
        clearSession();
        setLoginNotice(message);
        configureClient({ auth: null, site: '', mode: 'mock' });
      },
    });

    if (session) {
      configureClient({ auth: session.auth, site: session.siteUrl, mode: session.mode });
    }
  }, []);

  const login = useCallback(async (mode, siteUrl, username, password) => {
    const auth = basicAuth(username, password);
    const site = mode === 'live' ? siteUrl.replace(/\/+$/, '') : '';

    configureClient({ auth, site, mode });

    const res = await verifyLogin(auth);
    const user = res.data;

    if (!user.capabilities || !user.capabilities.edit_posts) {
      configureClient({ auth: null, site: '' });
      throw new Error(
        "This account can't edit posts. Log in with an Author, Editor, or Administrator account.",
      );
    }

    let postsPerPage = 10;
    try {
      const settingsRes = await getSettings();
      if (settingsRes.data?.posts_per_page) {
        postsPerPage = settingsRes.data.posts_per_page;
      }
    } catch (_) {
      /* settings endpoint may not be accessible — use default */
    }

    const s = { auth, user, siteUrl: site, mode, postsPerPage };
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
    configureClient({ auth: null, site: '', mode: 'mock' });
  }, []);

  const value = {
    session,
    loginNotice,
    isAuthenticated: !!session,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
