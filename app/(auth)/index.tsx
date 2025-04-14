import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthRoot() {
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    // Redirect to sign-in page after a brief delay
    const timer = setTimeout(() => {
      router.replace('/auth/sign-in');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="auto" />
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
});
