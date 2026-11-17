/**
 * @file Inline field validation error.
 *
 * Renders a short error message below a form field. Uses `role="alert"`
 * so screen readers announce the error when it appears. Renders nothing
 * when there is no message.
 */

import styles from './FieldError.module.css';

/**
 * Displays a validation error for a form field.
 *
 * @param {object} props
 * @param {string} props.id - HTML id, referenced by the field's `aria-describedby`.
 * @param {string} [props.message] - Error text. Component returns null if empty.
 * @returns {JSX.Element|null}
 */
export default function FieldError({ id, message }) {
  if (!message) return null;

  return (
    <p className={styles.error} id={id} role="alert">
      {message}
    </p>
  );
}
