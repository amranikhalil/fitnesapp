import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { ProfileProvider } from '../lib/auth/profile-context';
import { MealsProvider } from '../lib/meals';
import { ProgramsProvider } from '../lib/programs/programs-context';
import { StatisticsProvider } from '../lib/statistics/statistics-context';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { setupDatabase } from '../lib/utils/setup-db';

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

  // Initialize database on app startup
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Only attempt to set up the database if the user is authenticated
        if (isAuthenticated && !isGuestMode) {
          const result = await setupDatabase();
          console.log('Database initialization result:', result);
        }
      } catch (error) {
        console.error('Error initializing database:', error);
        // Continue app flow even if database initialization fails
        // The statistics context has fallback mechanisms
      }
    };

    // Run database initialization
    initializeDatabase();
  }, [isAuthenticated, isGuestMode]);

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
        // These screens are only accessible when authenticated or in guest mode
        <Stack.Screen name="dashboard" />
      ) : (
        // These screens are only accessible when not authenticated
        <Stack.Screen name="(auth)" />
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
          <ProfileProvider>
            <MealsProvider>
              <ProgramsProvider>
                <StatisticsProvider>
                  <RootLayoutNav />
                </StatisticsProvider>
              </ProgramsProvider>
            </MealsProvider>
          </ProfileProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
