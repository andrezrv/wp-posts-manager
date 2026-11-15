import { useAuth } from '../auth/AuthContext';
import styles from './TopBar.module.css';

const ICON_MARK = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="2.5" width="12" height="2" rx="1" fill="currentColor" />
    <rect x="2" y="7" width="8" height="2" rx="1" fill="currentColor" />
    <rect x="2" y="11.5" width="10" height="2" rx="1" fill="currentColor" />
  </svg>
);

export default function TopBar() {
  const { session, logout } = useAuth();

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
            <button type="button" className={styles.logoutBtn} onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
