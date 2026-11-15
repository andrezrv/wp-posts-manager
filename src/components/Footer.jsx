import { useAuth } from '../auth/AuthContext';
import styles from './Footer.module.css';

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
