/**
 * @file Post status badge.
 *
 * Renders a small colored pill showing the post's status label
 * (Published, Draft, Scheduled, etc.). The color is determined by
 * a CSS class matching the status key.
 */

import { STATUSES } from '../validation/constants';
import styles from './StatusPill.module.css';

/**
 * Colored badge displaying a post status.
 *
 * @param {object} props
 * @param {string} props.status - WordPress post status key (e.g. 'publish', 'draft').
 * @returns {JSX.Element}
 */
export default function StatusPill({ status }) {
  return (
    <span className={`${styles.pill} ${styles[status] || ''}`}>{STATUSES[status] || status}</span>
  );
}
