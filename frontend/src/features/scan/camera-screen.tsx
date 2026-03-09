import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CameraScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '600', color: '#ffffff' },
  sub: { fontSize: 14, color: '#a8a29e', marginTop: 8 },
});
