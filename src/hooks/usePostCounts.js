import { useState, useEffect, useCallback, useRef } from 'react';
import { getPostCounts } from '../api/endpoints';

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
