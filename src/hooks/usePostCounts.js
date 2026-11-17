/**
 * @file Hook for fetching post counts per status.
 *
 * Provides the counts displayed as badges on the status filter tabs.
 * Counts are supplementary — fetch failures are silently ignored
 * to avoid blocking the UI.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPostCounts } from '../api/endpoints';

/**
 * Fetch post counts per status for the tab badges.
 *
 * @returns {{ counts: object|null, refetchCounts: Function }}
 */
export default function usePostCounts() {
  const [counts, setCounts] = useState(null);
  const tokenRef = useRef(0);

  const fetch = useCallback(async () => {
    const token = ++tokenRef.current;
    try {
      const result = await getPostCounts();
      if (token === tokenRef.current) setCounts(result);
    } catch (_) {
      // counts are supplementary — don't block the UI on failure
    }
  }, []);

  useEffect(() => {
    fetch(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch sets state after await
  }, [fetch]);

  return { counts, refetchCounts: fetch };
}
