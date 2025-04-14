import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="auth/sign-up" />
        <Stack.Screen name="auth/reset-password" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="onboarding/goal-setting" />
        <Stack.Screen name="onboarding/program-recommendations" />
      </Stack>
    </>
  );
}
