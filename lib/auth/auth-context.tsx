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

  // Initialize session state
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for guest mode first
        const isGuest = await AsyncStorage.getItem('guest_mode');
        if (isGuest === 'true') {
          setState({
            ...initialState,
            isLoading: false,
            isAuthenticated: false,
            isGuestMode: true,
          });
          return;
        }
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear any invalid session data
          await supabase.auth.signOut();
          setState({
            ...initialState,
            isLoading: false,
          });
          return;
        }
        
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
        // Handle any exceptions by clearing state
        await supabase.auth.signOut();
        setState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          setState({
            session,
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
            isGuestMode: false,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            ...initialState,
            isLoading: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState({
            session,
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
            isGuestMode: false,
          });
        } else if (event === 'USER_UPDATED' && session) {
          setState({
            session,
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
            isGuestMode: false,
          });
        }
      }
    );

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
        await AsyncStorage.removeItem('guest_mode');
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
        await AsyncStorage.removeItem('guest_mode');
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
      await AsyncStorage.removeItem('guest_mode');
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
    await AsyncStorage.setItem('guest_mode', 'true');
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