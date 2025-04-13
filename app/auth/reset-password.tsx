import { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../lib/auth';

export default function ResetPassword() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailError(isValid ? '' : 'Please enter a valid email address');
    return isValid;
  };

  const handleResetPassword = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Reset errors
    setAuthError('');
    
    // Validate email
    const isEmailValid = validateEmail(email);
    
    if (!isEmailValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Request password reset from Supabase
      const { error } = await resetPassword(email);
      
      if (error) {
        setAuthError(error.message || 'Failed to send reset email. Please try again.');
      } else {
        setResetSent(true);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={navigateBack}
        />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Surface style={styles.formContainer} elevation={0}>
          <Text variant="headlineMedium" style={styles.title}>
            Reset Password
          </Text>
          
          {resetSent ? (
            <View>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Reset link sent!
              </Text>
              <Text variant="bodyMedium" style={styles.message}>
                We've sent a password reset link to {email}. Please check your email and follow the instructions.
              </Text>
              <Button
                mode="contained"
                onPress={navigateBack}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Return to Sign In
              </Button>
            </View>
          ) : (
            <View>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Enter your email to receive a password reset link
              </Text>

              {authError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{authError}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!emailError}
                  style={styles.input}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Send Reset Link
              </Button>
            </View>
          )}
        </Surface>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    margin: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
  },
  message: {
    marginBottom: 24,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(176, 0, 32, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
});
