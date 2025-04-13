import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { MealsProvider } from '../lib/meals';
import { View, ActivityIndicator } from 'react-native';

// Custom theme with modern color palette
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4E7EFF', // Main blue color
    primaryContainer: '#E5EDFF', // Light blue for containers
    secondary: '#FF8A65', // Orange accent
    secondaryContainer: '#FFEEE8', // Light orange for containers
    tertiary: '#9C27B0', // Purple accent
    tertiaryContainer: '#F0E6FF', // Light purple for containers
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F7FA',
    error: '#D32F2F',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onBackground: '#1A1C1E',
    onSurface: '#1A1C1E',
    outline: '#E0E0E0',
  },
  roundness: 16,
};

// Root layout with authentication logic
function RootLayoutNav() {
  const { isLoading, isAuthenticated, isGuestMode } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      {isAuthenticated || isGuestMode ? (
        // Authenticated/Guest routes
        <>
          <Stack.Screen name="dashboard/index" />
          <Stack.Screen name="dashboard/add-meal" />
          <Stack.Screen name="dashboard/meal-details" />
        </>
      ) : (
        // Auth routes
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="onboarding/goal-setting" />
          <Stack.Screen name="auth/sign-in" />
          <Stack.Screen name="auth/sign-up" />
          <Stack.Screen name="auth/reset-password" />
        </>
      )}
    </Stack>
  );
}

// Main layout component
export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthProvider>
          <MealsProvider>
            <RootLayoutNav />
          </MealsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
