import { Stack } from 'expo-router';

export default function ExamLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="instructions" />
      <Stack.Screen name="session" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="ielts-setup" />
      <Stack.Screen name="ielts-instructions" />
      <Stack.Screen name="ielts-section-instructions" />
      <Stack.Screen name="ielts-break" />
      <Stack.Screen name="ielts-session" />
      <Stack.Screen name="ielts-listening-instructions" />
      <Stack.Screen name="ielts-listening-session" />
      <Stack.Screen name="ielts-speaking-instructions" />
      <Stack.Screen name="ielts-speaking-session" />
      <Stack.Screen name="test-result" />
      <Stack.Screen name="subject-performance" />
      <Stack.Screen name="topic-performance" />
      <Stack.Screen name="review-answers" />
      <Stack.Screen name="question-review" />
    </Stack>
  );
}
