import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import styles from './TopBar.module.css';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (_) {}
  return 'system';
}

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

const THEME_CYCLE = { system: 'light', light: 'dark', dark: 'system' };

const THEME_ICONS = {
  system: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 14h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  light: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2.5v-1M8 14.5v-1M13.5 8h1M1.5 8h1M11.89 4.11l.7-.7M3.41 12.59l.7-.7M11.89 11.89l.7.7M3.41 3.41l.7.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  dark: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 9.5a5.5 5.5 0 01-7-7 5.5 5.5 0 107 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
};

const THEME_LABELS = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };

const ICON_MARK = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="2.5" width="12" height="2" rx="1" fill="currentColor" />
    <rect x="2" y="7" width="8" height="2" rx="1" fill="currentColor" />
    <rect x="2" y="11.5" width="10" height="2" rx="1" fill="currentColor" />
  </svg>
);

export default function TopBar() {
  const { session, logout } = useAuth();
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem('theme', theme); } catch (_) {}
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((t) => THEME_CYCLE[t]);
  }, []);

  const avatarUrl = session?.user.avatar_urls?.['48'] || session?.user.avatar_urls?.['96'] || '';
  const initials = session
    ? session.user.name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  const role =
    session?.user.roles?.[0]
      ? session.user.roles[0][0].toUpperCase() + session.user.roles[0].slice(1)
      : '';

  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        <a className={styles.brand} href={session ? '#/posts' : '#/login'}>
          <span className={styles.mark}>{ICON_MARK}</span>
          <span className={styles.brandName}>
            Posts Manager
            {session && <span className={styles.brandSite}>{session.mode === 'live' ? new URL(session.siteUrl).hostname : 'Demo site'}</span>}
          </span>
        </a>
        <span className={styles.spacer} />
        {session && (
          <div className={styles.user}>
            {avatarUrl ? (
              <img className={styles.avatar} src={avatarUrl} alt="" />
            ) : (
              <span className={styles.avatar}>{initials}</span>
            )}
            <span className={styles.userName}>
              {session.user.name}
              <span className={styles.userRole}>{role}</span>
            </span>
            <button
              type="button"
              className={styles.themeBtn}
              onClick={cycleTheme}
              aria-label={THEME_LABELS[theme]}
              title={THEME_LABELS[theme]}
            >
              {THEME_ICONS[theme]}
            </button>
            <button type="button" className={styles.logoutBtn} onClick={logout}>
              Log out
            </button>
          </div>
        )}
        {!session && (
          <button
            type="button"
            className={styles.themeBtn}
            onClick={cycleTheme}
            aria-label={THEME_LABELS[theme]}
            title={THEME_LABELS[theme]}
          >
            {THEME_ICONS[theme]}
          </button>
        )}
      </div>
    </header>
  );
}
