/**
 * @file Page footer with logout button.
 *
 * Renders a centered logout button at the bottom of the page.
 * Hidden when the user is not logged in (no session).
 */

import { useAuth } from '../auth/AuthContext';
import styles from './Footer.module.css';

/**
 * Footer component. Shows a logout button when authenticated.
 *
 * @returns {JSX.Element|null} Returns null when there is no active session.
 */
export default function Footer() {
  const { session, logout } = useAuth();
  if (!session) return null;

  return (
    <footer className={styles.footer}>
      <button type="button" className={styles.logoutBtn} onClick={logout}>
        Log out
      </button>
    </footer>
  );
}
