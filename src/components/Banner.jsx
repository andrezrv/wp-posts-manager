/**
 * @file Dismissable notification banner.
 *
 * Displays inline messages for errors, warnings, or success states.
 * Uses ARIA `role="alert"` for error/warning banners and
 * `role="status"` for success, so screen readers announce them.
 *
 * @example
 * <Banner message="Something went wrong." onDismiss={() => clear()} />
 * <Banner kind="ok" message="Post saved." />
 * <Banner kind="warning" message="Check your input." />
 */

import styles from './Banner.module.css';

/** Circled checkmark icon used for success banners. */
const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style={{ flexShrink: 0, marginTop: 1 }}
  >
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M5 8.5l2 2 4-4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Notification banner component.
 *
 * @param {object} props
 * @param {string} [props.message] - Text to display.
 * @param {'error'|'warning'|'ok'} [props.kind='error'] - Visual style.
 * @param {React.ReactNode} [props.children] - Alternative to message.
 * @param {Function} [props.onDismiss] - Callback when the dismiss button is clicked.
 * @returns {JSX.Element|null} Returns null if neither message nor children are provided.
 */
export default function Banner({ message, kind = 'error', children, onDismiss }) {
  if (!message && !children) return null;

  return (
    <div className={`${styles.banner} ${styles[kind]}`} role={kind === 'ok' ? 'status' : 'alert'}>
      {kind === 'ok' && <CheckIcon />}
      <span className={styles.text}>{message || children}</span>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
