import { supabase } from '../supabase';
import { Profile } from './api-types';

/**
 * Fetches the current user's profile
 */
export async function fetchUserProfile() {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
      
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }
}

/**
 * Updates the current user's profile
 */
export async function updateUserProfile(profile: Partial<Profile>) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.user.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}

/**
 * Check and consume an AI credit
 * Returns true if credit was successfully consumed, false if insufficient credits
 */
export async function useAICredit() {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // First check current credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', user.user.id)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    // If no credits or undefined, return false
    if (!profile || profile.ai_credits === undefined || profile.ai_credits <= 0) {
      return { success: false, error: null, remainingCredits: 0 };
    }
    
    // Consume a credit
    const remainingCredits = profile.ai_credits - 1;
    const { data, error } = await supabase
      .from('profiles')
      .update({ ai_credits: remainingCredits })
      .eq('id', user.user.id)
      .select('ai_credits')
      .single();
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true, 
      error: null, 
      remainingCredits: data?.ai_credits || remainingCredits 
    };
  } catch (error) {
    console.error('Error using AI credit:', error);
    return { success: false, error, remainingCredits: 0 };
  }
}

/**
 * Add AI credits to a user's account
 */
export async function addAICredits(amount: number) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // First get current credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', user.user.id)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    const currentCredits = profile?.ai_credits || 0;
    const newCredits = currentCredits + amount;
    
    // Update with new credit amount
    const { data, error } = await supabase
      .from('profiles')
      .update({ ai_credits: newCredits })
      .eq('id', user.user.id)
      .select('ai_credits')
      .single();
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true, 
      error: null, 
      totalCredits: data?.ai_credits || newCredits 
    };
  } catch (error) {
    console.error('Error adding AI credits:', error);
    return { success: false, error, totalCredits: 0 };
  }
}

/**
 * Uploads a profile avatar image
 */
export async function uploadProfileAvatar(uri: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // Convert image URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload to storage
    const fileExt = uri.split('.').pop();
    const fileName = `avatar-${user.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, blob);
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);
    
    // Update profile with new avatar URL
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.user.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { data: null, error };
  }
}
