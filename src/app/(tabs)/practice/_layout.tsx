import { Stack } from 'expo-router';

export default function PracticeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="practice-setup" />
      <Stack.Screen name="standard-setup" />
    </Stack>
  );
}
