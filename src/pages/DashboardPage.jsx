/**
 * @file Post-login success screen.
 *
 * Shows a confirmation that the user has authenticated successfully,
 * displaying their name, role, username, email, and connection mode.
 * This page is a transient landing screen — users typically navigate
 * to the post list immediately.
 */

import { useAuth } from '../auth/AuthContext';
import styles from './DashboardPage.module.css';

/**
 * Displays authenticated user details after a successful login.
 *
 * @returns {JSX.Element}
 */
export default function DashboardPage() {
  const { session } = useAuth();

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="24" fill="var(--ok-soft)" />
            <path
              d="M15 25l6 6 12-12"
              stroke="var(--ok)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <h1>Login successful</h1>
        <p className={styles.detail}>
          Authenticated as <strong>{session.user.name}</strong> ({session.user.roles?.[0] || 'user'}
          )
        </p>
        <dl className={styles.meta}>
          <dt>Username</dt>
          <dd>{session.user.username || session.user.slug}</dd>
          <dt>Email</dt>
          <dd>{session.user.email}</dd>
          <dt>Site</dt>
          <dd>{session.siteUrl}</dd>
        </dl>
      </div>
    </div>
  );
}
