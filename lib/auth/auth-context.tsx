import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { AuthContextType, AuthState } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial auth state
const initialState: AuthState = {
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isGuestMode: false,
};

// Provider component that wraps the app and makes auth available to any child component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Listen for authentication state changes
  useEffect(() => {
    // Check if there's an active session
    const checkSession = async () => {
      try {
        // Check if user previously used guest mode
        const storedGuestMode = await AsyncStorage.getItem('guestMode');
        
        if (storedGuestMode === 'true') {
          setState({
            session: null,
            user: null,
            isLoading: false,
            isAuthenticated: false,
            isGuestMode: true,
          });
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setState({
            session,
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
            isGuestMode: false,
          });
        } else {
          setState({
            ...initialState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          session,
          user: session?.user ?? null,
          isLoading: false,
          isAuthenticated: !!session,
          isGuestMode: false,
        });
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      // If sign up is successful, turn off guest mode
      if (!error) {
        await AsyncStorage.removeItem('guestMode');
        setState(prevState => ({
          ...prevState,
          isGuestMode: false
        }));
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: error as Error };
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // If sign in is successful, turn off guest mode
      if (!error) {
        await AsyncStorage.removeItem('guestMode');
        setState(prevState => ({
          ...prevState,
          isGuestMode: false
        }));
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as Error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Also clear guest mode state
      await AsyncStorage.removeItem('guestMode');
      setState(prevState => ({
        ...prevState,
        isGuestMode: false
      }));
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Continue as guest function
  const continueAsGuest = async () => {
    // Set guest mode
    await AsyncStorage.setItem('guestMode', 'true');
    setState({
      session: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isGuestMode: true,
    });
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'calorietracker://reset-password',
      });
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: error as Error };
    }
  };

  // Context value
  const value = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    continueAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}