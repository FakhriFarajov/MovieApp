import { useCallback, useState } from 'react';

export const useRefresh = () => {
  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = useCallback(async (action?: () => Promise<void> | void) => {
    try {
      setRefreshing(true);
      await (action ? action() : Promise.resolve());
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { refreshing, doRefresh } as const;
};

export default useRefresh;
