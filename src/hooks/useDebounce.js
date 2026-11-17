/**
 * @file Debounce hook.
 *
 * Returns a debounced version of the input value that only updates
 * after the specified delay has passed without changes. Used by the
 * search input to avoid excessive API calls while typing.
 *
 * Default delay is configurable via `VITE_DEBOUNCE_DELAY_MS`.
 */

import { useState, useEffect } from 'react';

/** Default debounce delay in ms, configurable via env var. */
const DEFAULT_DELAY = Number(import.meta.env.VITE_DEBOUNCE_DELAY_MS) || 350;

/**
 * Debounce a value.
 *
 * @param {*} value - The value to debounce.
 * @param {number} [delay=DEFAULT_DELAY] - Debounce delay in milliseconds.
 * @returns {*} The debounced value.
 */
export default function useDebounce(value, delay = DEFAULT_DELAY) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
