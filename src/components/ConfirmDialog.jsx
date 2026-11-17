/**
 * @file Modal confirmation dialog.
 *
 * Used for destructive actions like deleting posts. Traps keyboard
 * focus within the dialog, closes on Escape, and closes on backdrop
 * click. Initial focus lands on the Cancel button to prevent
 * accidental confirmation.
 *
 * Supports a "busy" state that disables both buttons and shows a
 * spinner on the confirm button while an async action is in progress.
 */

import { useEffect, useRef } from 'react';
import Spinner from './Spinner';
import styles from './ConfirmDialog.module.css';

/**
 * Modal dialog with confirm and cancel actions.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is visible.
 * @param {string} props.title - Dialog heading.
 * @param {React.ReactNode} props.children - Body content.
 * @param {string} [props.confirmLabel='Confirm'] - Confirm button text.
 * @param {string} [props.cancelLabel='Cancel'] - Cancel button text.
 * @param {boolean} [props.danger=false] - Applies danger styling to confirm button.
 * @param {boolean} [props.busy=false] - Disables buttons and shows spinner.
 * @param {Function} props.onConfirm - Called when the confirm button is clicked.
 * @param {Function} props.onCancel - Called when cancel, Escape, or backdrop is clicked.
 * @returns {JSX.Element|null}
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open && cancelRef.current) cancelRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );
        const list = Array.from(focusable);
        const idx = list.indexOf(document.activeElement);
        if (e.shiftKey && idx <= 0) {
          e.preventDefault();
          list[list.length - 1]?.focus();
        } else if (!e.shiftKey && idx === list.length - 1) {
          e.preventDefault();
          list[0]?.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={dialogRef}
      >
        <h2 id="dialog-title">{title}</h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={busy}
            ref={cancelRef}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${danger ? styles.danger : ''}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
