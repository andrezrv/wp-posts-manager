import styles from './FieldError.module.css';

export default function FieldError({ id, message }) {
  if (!message) return null;

  return (
    <p className={styles.error} id={id} role="alert">
      {message}
    </p>
  );
}
