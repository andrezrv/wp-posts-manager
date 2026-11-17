/**
 * @file Animated loading spinner.
 *
 * A CSS-animated circular spinner used as a loading indicator inside
 * buttons and other UI elements. Hidden from screen readers via
 * `aria-hidden`.
 */

import styles from './Spinner.module.css';

/**
 * Loading spinner.
 *
 * @param {object} props
 * @param {number} [props.size=15] - Width and height in pixels.
 * @returns {JSX.Element}
 */
export default function Spinner({ size = 15 }) {
  return (
    <span className={styles.spinner} style={{ width: size, height: size }} aria-hidden="true" />
  );
}
