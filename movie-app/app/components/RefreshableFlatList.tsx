import React, { useCallback, useState } from 'react';
import { FlatList, FlatListProps } from 'react-native';

type Props<ItemT> = Omit<FlatListProps<ItemT>, 'refreshing' | 'onRefresh'> & {
  onRefreshAction?: () => Promise<void> | void;
};

export default function RefreshableFlatList<ItemT>(props: Props<ItemT>) {
  const { onRefreshAction, ...rest } = props as any;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefreshAction) return;
    try {
      setRefreshing(true);
      await onRefreshAction();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshAction]);

  return <FlatList {...(rest as FlatListProps<ItemT>)} refreshing={refreshing} onRefresh={handleRefresh} />;
}
