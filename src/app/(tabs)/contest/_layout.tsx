import { Stack } from 'expo-router';

export default function ContestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="rules" />
      <Stack.Screen name="register" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="success" />
      <Stack.Screen name="leaderboard" />
    </Stack>
  );
}
