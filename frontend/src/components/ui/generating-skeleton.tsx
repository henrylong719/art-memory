/* eslint-disable better-tailwindcss/no-unknown-classes */
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Text, View } from '@/components/ui';

/**
 * Animated skeleton shown while AI generates a story.
 * Features:
 *  - Spinner icon
 *  - Three shimmer bars that pulse opacity in a staggered wave
 *  - "Generating..." label with a subtle pulse
 */
export function GeneratingSkeleton() {
  // Each bar gets its own opacity value so they shimmer in sequence
  const bar1 = useSharedValue(0.3);
  const bar2 = useSharedValue(0.3);
  const bar3 = useSharedValue(0.3);
  const labelOpacity = useSharedValue(0.6);

  useEffect(() => {
    const duration = 600;
    const easing = Easing.inOut(Easing.ease);

    // Staggered wave: bar1 → bar2 → bar3, repeating
    bar1.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration, easing }),
        withTiming(0.3, { duration, easing }),
      ),
      -1,
      false,
    );

    bar2.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 150 }), // stagger delay
        withTiming(0.8, { duration, easing }),
        withTiming(0.3, { duration, easing }),
      ),
      -1,
      false,
    );

    bar3.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 300 }), // stagger delay
        withTiming(0.8, { duration, easing }),
        withTiming(0.3, { duration, easing }),
      ),
      -1,
      false,
    );

    // Label pulses gently
    labelOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing }),
        withTiming(0.5, { duration: 800, easing }),
      ),
      -1,
      false,
    );
  }, [bar1, bar2, bar3, labelOpacity]);

  const bar1Style = useAnimatedStyle(() => ({ opacity: bar1.value }));
  const bar2Style = useAnimatedStyle(() => ({ opacity: bar2.value }));
  const bar3Style = useAnimatedStyle(() => ({ opacity: bar3.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  return (
    <View className="bg-charcoal-50 border border-neutral-200 rounded-2xl p-6 items-center">
      {/* Spinner */}
      <View
        className="w-12 h-12 bg-white rounded-full items-center justify-center mb-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <ActivityIndicator size="small" color="#1c1917" />
      </View>

      {/* Shimmer bars */}
      <View className="w-full gap-3 mb-5 px-4">
        <Animated.View style={bar1Style}>
          <View className="h-2.5 bg-neutral-200 rounded-full w-full" />
        </Animated.View>
        <Animated.View style={bar2Style}>
          <View className="h-2.5 bg-neutral-200 rounded-full w-[85%] self-center" />
        </Animated.View>
        <Animated.View style={bar3Style}>
          <View className="h-2.5 bg-neutral-200 rounded-full w-[60%] self-center" />
        </Animated.View>
      </View>

      {/* Label */}
      <Animated.View style={labelStyle}>
        <View className="bg-neutral-200 px-5 py-2.5 rounded-xl">
          <Text className="text-sm font-medium text-charcoal-400">
            Generating...
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
