import { useState, useEffect } from 'react';

const DEFAULT_DELAY = Number(import.meta.env.VITE_DEBOUNCE_DELAY_MS) || 350;

export default function useDebounce(value, delay = DEFAULT_DELAY) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
