import { Stack } from 'expo-router';

export default function ArtworksLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" />
    </Stack>
  );
}
