import { supabase } from '../supabase';
import { DailyLog } from './api-types';

/**
 * Fetches a daily log for a specific date
 */
export async function fetchDailyLog(date: string = new Date().toISOString().split('T')[0]) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('log_date', date)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching daily log:', error);
    return { data: null, error };
  }
}

/**
 * Creates or updates a daily log
 */
export async function upsertDailyLog(dailyLog: DailyLog) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // Check if a log already exists for this date
    const { data: existingLog } = await fetchDailyLog(dailyLog.log_date);
    
    if (existingLog) {
      // Update existing log
      const { data, error } = await supabase
        .from('daily_logs')
        .update({
          ...dailyLog,
          user_id: user.user.id,
        })
        .eq('id', existingLog.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } else {
      // Create new log
      const { data, error } = await supabase
        .from('daily_logs')
        .insert({
          ...dailyLog,
          user_id: user.user.id,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error upserting daily log:', error);
    return { data: null, error };
  }
}

/**
 * Updates a daily log with nutritional totals calculated from meals
 */
export async function updateDailyLogNutrition(date: string = new Date().toISOString().split('T')[0]) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // Calculate totals from meals for this date
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('total_calories, total_protein, total_carbs, total_fat')
      .eq('user_id', user.user.id)
      .eq('meal_date', date);
    
    if (mealsError) {
      throw mealsError;
    }
    
    // Calculate totals
    const totals = meals?.reduce((acc, meal) => {
      return {
        total_calories: acc.total_calories + (meal.total_calories || 0),
        total_protein: acc.total_protein + (meal.total_protein || 0),
        total_carbs: acc.total_carbs + (meal.total_carbs || 0),
        total_fat: acc.total_fat + (meal.total_fat || 0)
      };
    }, { 
      total_calories: 0, 
      total_protein: 0, 
      total_carbs: 0, 
      total_fat: 0 
    });
    
    // Upsert daily log with calculated totals
    return await upsertDailyLog({
      log_date: date,
      ...totals
    });
  } catch (error) {
    console.error('Error updating daily log nutrition:', error);
    return { data: null, error };
  }
}

/**
 * Fetches daily logs for a date range
 */
export async function fetchDailyLogsByDateRange(startDate: string, endDate: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.user.id)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    return { data: [], error };
  }
}

/**
 * Records user weight in a daily log
 */
export async function recordWeight(weight: number, date: string = new Date().toISOString().split('T')[0]) {
  try {
    // Check if a log already exists
    const { data: existingLog } = await fetchDailyLog(date);
    
    if (existingLog) {
      // Update existing log with weight
      return await upsertDailyLog({
        ...existingLog,
        weight_recorded: weight
      });
    } else {
      // Create new log with weight
      return await upsertDailyLog({
        log_date: date,
        weight_recorded: weight
      });
    }
  } catch (error) {
    console.error('Error recording weight:', error);
    return { data: null, error };
  }
}
