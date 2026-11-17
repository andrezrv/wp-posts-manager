/**
 * @file Application header bar.
 *
 * Displays the brand name and site indicator, the authenticated user's
 * avatar and name, a theme toggle (cycles system → light → dark),
 * and an external link to the WordPress admin dashboard.
 *
 * When no session is active (login page), only the brand and theme
 * toggle are shown.
 *
 * Theme preference is persisted to localStorage and applied via a
 * `data-theme` attribute on the document root, which the CSS tokens
 * in `tokens.css` respond to.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import styles from './TopBar.module.css';

/** Read the saved theme preference from localStorage. */
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (_) {}
  return 'system';
}

/** Set or remove the `data-theme` attribute on the document root. */
function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/** Maps each theme to the next one in the cycle. */
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
      <path
        d="M8 2.5v-1M8 14.5v-1M13.5 8h1M1.5 8h1M11.89 4.11l.7-.7M3.41 12.59l.7-.7M11.89 11.89l.7.7M3.41 3.41l.7.7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  dark: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 9.5a5.5 5.5 0 01-7-7 5.5 5.5 0 107 7z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
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
  const { session } = useAuth();
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (_) {}
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

  const role = session?.user.roles?.[0]
    ? session.user.roles[0][0].toUpperCase() + session.user.roles[0].slice(1)
    : '';

  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        <a className={styles.brand} href={session ? '#/posts' : '#/login'}>
          <span className={styles.mark}>{ICON_MARK}</span>
          <span className={styles.brandName}>
            Posts Manager
            {session && (
              <span className={styles.brandSite}>{new URL(session.siteUrl).hostname}</span>
            )}
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
            <a
              href={`${session.siteUrl}/wp-admin/`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.adminBtn}
              aria-label="Open WordPress admin"
              title="Open WordPress admin"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M6 3.5H3.5a1 1 0 00-1 1V12.5a1 1 0 001 1H11.5a1 1 0 001-1V10M9.5 2.5h4m0 0v4m0-4l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
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
