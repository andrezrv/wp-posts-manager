import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Footer from './Footer';
import styles from './AppLayout.module.css';

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
