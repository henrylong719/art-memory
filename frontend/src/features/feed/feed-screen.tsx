import { useCallback } from 'react';
import type { Post } from './api';
import { FlashList } from '@shopify/flash-list';

import { EmptyList, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { usePosts } from './api';
import { PostCard } from './components/post-card';

export function FeedScreen() {
  const { data, isPending, isError } = usePosts();
  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostCard {...item} />,
    [],
  );

  if (isError) {
    return (
      <View>
        <Text> Error Loading data </Text>
      </View>
    );
  }
  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        ListEmptyComponent={<EmptyList isLoading={isPending} />}
      />
    </View>
  );
}
