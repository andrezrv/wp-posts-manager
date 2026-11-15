import styles from './Banner.module.css';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 8.5l2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Banner({ message, kind = 'error', children }) {
  if (!message && !children) return null;

  return (
    <div className={`${styles.banner} ${styles[kind]}`} role="alert">
      {kind === 'ok' && <CheckIcon />}
      <span>{message || children}</span>
    </div>
  );
}
