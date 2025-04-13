import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ActivityIndicator, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  // Check authentication status and redirect accordingly
  useEffect(() => {
    if (!isLoading) {
      // Add a small delay for the splash screen effect
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          // User is authenticated, redirect to dashboard
          router.replace('/dashboard');
        } else {
          // User is not authenticated, redirect to onboarding
          router.replace('/onboarding');
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <LinearGradient
      colors={['#5E60CE', '#7400B8']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Avatar.Icon 
              size={80} 
              icon="food-apple" 
              color="#FFFFFF"
              style={styles.logo}
            />
          </View>
          
          <Text variant="displaySmall" style={styles.title}>
            CalorieTracker
          </Text>
          
          <Text variant="bodyLarge" style={styles.subtitle}>
            Smart nutrition tracking made simple
          </Text>
          
          <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
