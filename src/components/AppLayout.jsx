/**
 * @file Shared page layout.
 *
 * Renders the application shell used by all routes: the top bar,
 * the main content area (filled by the active route via `<Outlet>`),
 * and the footer with the logout button.
 */

import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Footer from './Footer';
import styles from './AppLayout.module.css';

/**
 * Page layout wrapper: TopBar + main content + Footer.
 *
 * @returns {JSX.Element}
 */
export default function AppLayout() {
  return (
    <div className={styles.app}>
      <TopBar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
