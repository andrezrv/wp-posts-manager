import { STATUSES } from '../validation/constants';
import styles from './StatusPill.module.css';

export default function StatusPill({ status }) {
  return <span className={`${styles.pill} ${styles[status] || ''}`}>{STATUSES[status] || status}</span>;
}
