import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CollectionDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Collection Detail</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '600', color: '#1c1917' },
  sub: { fontSize: 14, color: '#78716c', marginTop: 8 },
});
