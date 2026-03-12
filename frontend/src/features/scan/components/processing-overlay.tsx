/* eslint-disable better-tailwindcss/no-unknown-classes */
import { Motion, AnimatePresence } from '@legendapp/motion';
import {
  ActivityIndicator,
  Image as RNImage,
  StyleSheet,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { Text, View } from '@/components/ui';

type ProcessingOverlayProps = {
  visible: boolean;
  imageUri: string | null;
  isLandscape: boolean;
  isCombined: boolean;
  scanLineStyle: { transform: { translateY: number }[] };
  pulseStyle: { opacity: number };
};

export function ProcessingOverlay({
  visible,
  imageUri,
  isLandscape,
  isCombined,
  scanLineStyle,
  pulseStyle,
}: ProcessingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <Motion.View
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 250 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            backgroundColor: '#2E2E2E',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: isLandscape ? 300 : 260,
              aspectRatio: isLandscape ? 4 / 3 : 3 / 4,
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 28,
            }}
          >
            {imageUri && (
              <RNImage
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                blurRadius={20}
              />
            )}

            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0,0,0,0.35)',
              }}
            />

            <Animated.View
              style={[
                scanLineStyle,
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  shadowColor: '#fff',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                },
              ]}
            />

            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </View>

          <Animated.View style={pulseStyle}>
            <Text className="font-serif text-xl tracking-wide text-white">
              {isCombined
                ? 'Analyzing artwork & details...'
                : 'Identifying artwork...'}
            </Text>
          </Animated.View>
        </Motion.View>
      )}
    </AnimatePresence>
  );
}
