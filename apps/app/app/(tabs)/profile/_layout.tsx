import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="support" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="professional" />
    </Stack>
  );
}
