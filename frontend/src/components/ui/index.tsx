/* eslint-disable react-refresh/only-export-components */
import type { ComponentType } from 'react';
import type { SafeAreaViewProps } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export * from './button';
export * from './checkbox';
export { default as colors } from './colors';
export * from './focus-aware-status-bar';
export * from './image';
export * from './input';
export * from './list';
export * from './modal';
export * from './progress-bar';
export * from './select';
export * from './text';
export * from './utils';

// export base components from react-native
export {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

// SafeAreaView wrapped with Uniwind so className (flex-1, bg-*, etc.) is processed
export const SafeAreaView = withUniwind(RNSafeAreaView) as ComponentType<
  SafeAreaViewProps & { className?: string }
>;

// Apply withUniwind to Svg to add className support
export const StyledSvg = withUniwind(Svg);
