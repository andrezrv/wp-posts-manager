import styles from './Banner.module.css';

export default function Banner({ message, kind = 'error', children }) {
  if (!message && !children) return null;

  return (
    <div className={`${styles.banner} ${styles[kind]}`} role="alert">
      <span>{message || children}</span>
    </div>
  );
}
