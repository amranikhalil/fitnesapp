import { supabase } from '../supabase';
import { HealthGoal } from './api-types';

/**
 * Fetches the current user's health goal
 */
export async function fetchHealthGoal() {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('health_goals')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching health goal:', error);
    return { data: null, error };
  }
}

/**
 * Creates a new health goal for the current user
 */
export async function createHealthGoal(healthGoal: HealthGoal) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('health_goals')
      .insert({
        ...healthGoal,
        user_id: user.user.id
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating health goal:', error);
    return { data: null, error };
  }
}

/**
 * Updates an existing health goal
 */
export async function updateHealthGoal(id: string, healthGoal: Partial<HealthGoal>) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('health_goals')
      .update(healthGoal)
      .eq('id', id)
      .eq('user_id', user.user.id) // Ensure the user can only update their own goals
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating health goal:', error);
    return { data: null, error };
  }
}

/**
 * Deletes a health goal
 */
export async function deleteHealthGoal(id: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { error } = await supabase
      .from('health_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id); // Ensure the user can only delete their own goals
    
    if (error) {
      throw error;
    }
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting health goal:', error);
    return { data: null, error };
  }
}
