import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './';
import * as profileService from '../services/profile-service';
import { Profile } from '../services/api-types';

// Define context interface
interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile | null>;
  uploadAvatar: (uri: string) => Promise<string | null>;
  useAICredit: () => Promise<{success: boolean, remainingCredits: number}>;
  addAICredits: (amount: number) => Promise<{success: boolean, totalCredits: number}>;
  aiCreditsAvailable: number;
}

// Create context
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { user, isAuthenticated, isGuestMode } = useAuth();

  // Fetch profile from the API
  const fetchProfile = async () => {
    if (!isAuthenticated && !isGuestMode) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, use a default guest profile
        setProfile({
          id: 'guest',
          username: 'Guest User',
          full_name: 'Guest User',
          avatar_url: null,
          is_subscribed: false,
          ai_credits: 3 // Give guest users 3 free AI credits
        });
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await profileService.fetchUserProfile();
      
      if (error) {
        throw error;
      }
      
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>): Promise<Profile | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        return updatedProfile;
      }
      
      const { data, error } = await profileService.updateUserProfile(updates);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setProfile(data);
        return data;
      }
      
      return null;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (uri: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state with the URI
        const updatedProfile = { ...profile, avatar_url: uri };
        setProfile(updatedProfile);
        return uri;
      }
      
      const { data, error } = await profileService.uploadProfileAvatar(uri);
      
      if (error) {
        throw error;
      }
      
      if (data && data.avatar_url) {
        setProfile(data);
        return data.avatar_url;
      }
      
      return null;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err : new Error('Failed to upload avatar'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Use an AI credit
  const useAICredit = async (): Promise<{success: boolean, remainingCredits: number}> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, manage credits locally
        if (!profile || (profile.ai_credits !== undefined && profile.ai_credits <= 0)) {
          return { success: false, remainingCredits: 0 };
        }
        
        const remainingCredits = (profile.ai_credits || 0) - 1;
        setProfile(prev => prev ? { ...prev, ai_credits: remainingCredits } : null);
        return { success: true, remainingCredits };
      }
      
      const { success, error, remainingCredits } = await profileService.useAICredit();
      
      if (error) {
        throw error;
      }
      
      // Update local profile state
      if (success && profile) {
        setProfile({ ...profile, ai_credits: remainingCredits });
      }
      
      return { success, remainingCredits };
    } catch (err) {
      console.error('Error using AI credit:', err);
      setError(err instanceof Error ? err : new Error('Failed to use AI credit'));
      return { success: false, remainingCredits: profile?.ai_credits || 0 };
    } finally {
      setIsLoading(false);
    }
  };

  // Add AI credits
  const addAICredits = async (amount: number): Promise<{success: boolean, totalCredits: number}> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, manage credits locally
        const currentCredits = profile?.ai_credits || 0;
        const totalCredits = currentCredits + amount;
        setProfile(prev => prev ? { ...prev, ai_credits: totalCredits } : null);
        return { success: true, totalCredits };
      }
      
      const { success, error, totalCredits } = await profileService.addAICredits(amount);
      
      if (error) {
        throw error;
      }
      
      // Update local profile state
      if (success && profile) {
        setProfile({ ...profile, ai_credits: totalCredits });
      }
      
      return { success, totalCredits };
    } catch (err) {
      console.error('Error adding AI credits:', err);
      setError(err instanceof Error ? err : new Error('Failed to add AI credits'));
      return { success: false, totalCredits: profile?.ai_credits || 0 };
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile when user is authenticated
  useEffect(() => {
    if (isAuthenticated || isGuestMode) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, isGuestMode]);

  // Context value
  const value = {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    useAICredit,
    addAICredits,
    aiCreditsAvailable: profile?.ai_credits || 0
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

// Custom hook to use the profile context
export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
