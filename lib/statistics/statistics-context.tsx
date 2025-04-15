import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth/auth-context'; // Import directly from auth-context
import { useProfile } from '../auth/profile-context';
import { useMeals } from '../meals';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Plant growth stages
export enum PlantStage {
  SEED = 0,
  SPROUT = 1,
  SMALL_PLANT = 2,
  MEDIUM_PLANT = 3,
  LARGE_PLANT = 4,
  FLOWERING = 5,
  MATURE = 6,
}

// Interface for daily statistics
interface DailyStats {
  date: string;
  caloriesConsumed: number;
  caloriesGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  carbsConsumed: number;
  carbsGoal: number;
  fatConsumed: number;
  fatGoal: number;
  waterConsumed: number;
  waterGoal: number;
  goalsMet: number; // Number of goals met (0-5)
}

// Interface for user's statistics
interface UserStats {
  streakDays: number;
  plantStage: PlantStage;
  plantProgress: number; // 0-100%
  weeklyStats: DailyStats[];
  monthlyStats: DailyStats[];
  lastUpdated: string;
}

// Default empty stats
const defaultUserStats: UserStats = {
  streakDays: 0,
  plantStage: PlantStage.SEED,
  plantProgress: 0,
  weeklyStats: [],
  monthlyStats: [],
  lastUpdated: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
};

// Context interface
interface StatisticsContextType {
  stats: UserStats;
  isLoading: boolean;
  error: Error | null;
  fetchStats: () => Promise<void>;
  updateDailyStats: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

// Create the context
const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

// Provider component
export function StatisticsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<UserStats>(defaultUserStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { user, isAuthenticated, isGuestMode } = useAuth();
  const { profile } = useProfile();
  const { meals } = useMeals();

  // Calculate if the user has met their goals
  const calculateGoalsMet = (consumption: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  }): number => {
    const caloriesGoal = profile?.daily_calories_target || 2000;
    const proteinGoal = profile?.daily_protein_target || 120;
    const carbsGoal = profile?.daily_carbs_target || 250;
    const fatGoal = profile?.daily_fat_target || 65;
    const waterGoal = 8; // Default 8 glasses of water

    let goalsMet = 0;
    
    // Check if each goal is met (within 5% margin)
    if (consumption.calories >= caloriesGoal * 0.95 && consumption.calories <= caloriesGoal * 1.05) goalsMet++;
    if (consumption.protein >= proteinGoal * 0.95) goalsMet++;
    if (consumption.carbs <= carbsGoal * 1.05) goalsMet++;
    if (consumption.fat <= fatGoal * 1.05) goalsMet++;
    if (consumption.water >= waterGoal) goalsMet++;
    
    return goalsMet;
  };

  // Calculate today's consumption
  const calculateTodaysConsumption = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Filter meals from today
    const todaysMeals = meals.filter(meal => {
      const mealDate = meal.meal_date || today; // Use meal_date instead of date
      return mealDate === today;
    });
    
    // Calculate total consumption
    const consumption = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      water: 0, // This would need a separate tracking mechanism
    };
    
    todaysMeals.forEach(meal => {
      // Add meal calories
      consumption.calories += meal.calories || 0;
      
      // Process food items in the meal
      meal.items?.forEach(item => { // Use items instead of foodItems
        consumption.protein += item.protein || 0;
        consumption.carbs += item.carbs || 0;
        consumption.fat += item.fat || 0;
      });
    });
    
    return consumption;
  };

  // Update plant growth based on goals met
  const updatePlantGrowth = (goalsMet: number) => {
    // Clone current stats
    const updatedStats = { ...stats };
    
    // Add progress based on goals met (20% per goal)
    const progressIncrease = goalsMet * 20;
    updatedStats.plantProgress += progressIncrease;
    
    // If progress reaches 100%, advance to next stage
    if (updatedStats.plantProgress >= 100) {
      // Move to next plant stage if not already at maximum
      if (updatedStats.plantStage < PlantStage.MATURE) {
        updatedStats.plantStage += 1;
        updatedStats.plantProgress = 0; // Reset progress for the next stage
      } else {
        updatedStats.plantProgress = 100; // Cap at 100% if at max stage
      }
    }
    
    // Update streak days
    if (goalsMet > 0) {
      updatedStats.streakDays += 1;
    } else {
      updatedStats.streakDays = 0; // Reset streak if no goals met
    }
    
    return updatedStats;
  };

  // Fetch statistics from storage or database
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // For guest mode, fetch from AsyncStorage
        const storedStats = await AsyncStorage.getItem('guest_statistics');
        if (storedStats) {
          setStats(JSON.parse(storedStats));
        } else {
          // Initialize with defaults
          setStats(defaultUserStats);
          await AsyncStorage.setItem('guest_statistics', JSON.stringify(defaultUserStats));
        }
      } else if (isAuthenticated && user) {
        try {
          // For authenticated users, fetch from Supabase
          const { data, error } = await supabase
            .from('user_statistics')
            .select('*')
            .eq('user_id', user.id);
          
          // Check for error with the query itself
          if (error && error.code !== 'PGRST116') {
            // Check if error is due to missing table
            if (error.code === '42P01') { // PostgreSQL code for undefined_table
              console.log('Statistics table does not exist yet, using defaults');
              setStats(defaultUserStats);
              return;
            }
            throw error;
          }
          
          // If no data or empty array, create a new record
          if (!data || data.length === 0) {
            console.log('No statistics found for user, creating initial record');
            
            // Create a new record for this user
            const { error: insertError } = await supabase
              .from('user_statistics')
              .insert([{ 
                user_id: user.id, 
                statistics: defaultUserStats 
              }]);
            
            if (insertError) {
              console.error('Error creating initial statistics record:', insertError);
              // Fall back to local storage if insert fails
              await AsyncStorage.setItem('user_statistics_' + user.id, JSON.stringify(defaultUserStats));
            }
            
            setStats(defaultUserStats);
          } else {
            // Data exists, use the first record
            setStats(data[0].statistics);
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Fallback to defaults when there's any database error
          setStats(defaultUserStats);
          
          // Try to store in AsyncStorage as fallback
          try {
            await AsyncStorage.setItem('user_statistics_' + user.id, JSON.stringify(defaultUserStats));
          } catch (storageError) {
            console.error('Failed to store statistics in AsyncStorage:', storageError);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch statistics'));
      // Fallback to defaults
      setStats(defaultUserStats);
    } finally {
      setIsLoading(false);
    }
  };

  // Update daily statistics
  const updateDailyStats = async () => {
    if (!isAuthenticated && !isGuestMode) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate today's consumption
      const consumption = calculateTodaysConsumption();
      const goalsMet = calculateGoalsMet(consumption);
      
      // Create today's stats entry
      const today = new Date().toISOString().split('T')[0];
      const dailyStats: DailyStats = {
        date: today,
        caloriesConsumed: consumption.calories,
        caloriesGoal: profile?.daily_calories_target || 2000,
        proteinConsumed: consumption.protein,
        proteinGoal: profile?.daily_protein_target || 120,
        carbsConsumed: consumption.carbs,
        carbsGoal: profile?.daily_carbs_target || 250,
        fatConsumed: consumption.fat,
        fatGoal: profile?.daily_fat_target || 65,
        waterConsumed: consumption.water,
        waterGoal: 8,
        goalsMet,
      };
      
      // Update weekly and monthly stats
      let updatedStats = { ...stats };
      
      // Update weekly stats (keep only last 7 days)
      const existingWeeklyStatIndex = updatedStats.weeklyStats.findIndex(
        s => s.date === today
      );
      
      if (existingWeeklyStatIndex >= 0) {
        updatedStats.weeklyStats[existingWeeklyStatIndex] = dailyStats;
      } else {
        updatedStats.weeklyStats.push(dailyStats);
        if (updatedStats.weeklyStats.length > 7) {
          // Keep only last 7 days
          updatedStats.weeklyStats = updatedStats.weeklyStats.slice(-7);
        }
      }
      
      // Update monthly stats (keep only last 30 days)
      const existingMonthlyStatIndex = updatedStats.monthlyStats.findIndex(
        s => s.date === today
      );
      
      if (existingMonthlyStatIndex >= 0) {
        updatedStats.monthlyStats[existingMonthlyStatIndex] = dailyStats;
      } else {
        updatedStats.monthlyStats.push(dailyStats);
        if (updatedStats.monthlyStats.length > 30) {
          // Keep only last 30 days
          updatedStats.monthlyStats = updatedStats.monthlyStats.slice(-30);
        }
      }
      
      // Update plant growth
      updatedStats = updatePlantGrowth(goalsMet);
      updatedStats.lastUpdated = today;
      
      // Save updated stats
      if (isGuestMode) {
        await AsyncStorage.setItem('guest_statistics', JSON.stringify(updatedStats));
      } else if (isAuthenticated && user) {
        try {
          // Try to update the statistics in Supabase
          const { error } = await supabase
            .from('user_statistics')
            .update({ statistics: updatedStats })
            .eq('user_id', user.id);
          
          // If error is due to missing table or record not found, try to create instead
          if (error && (error.code === '42P01' || error.code === 'PGRST116')) {
            try {
              // Try to insert a new record
              const { error: insertError } = await supabase
                .from('user_statistics')
                .insert([{ user_id: user.id, statistics: updatedStats }]);
              
              if (insertError && insertError.code === '42P01') {
                // Table doesn't exist, just use local storage as fallback
                console.log('Statistics table does not exist, using local storage fallback');
                await AsyncStorage.setItem('user_statistics_' + user.id, JSON.stringify(updatedStats));
              } else if (insertError) {
                throw insertError;
              }
            } catch (insertErr) {
              console.error('Error inserting statistics:', insertErr);
              // Use local storage as fallback
              await AsyncStorage.setItem('user_statistics_' + user.id, JSON.stringify(updatedStats));
            }
          } else if (error) {
            throw error;
          }
        } catch (dbError) {
          console.error('Database error updating statistics:', dbError);
          // Use local storage as fallback
          await AsyncStorage.setItem('user_statistics_' + user.id, JSON.stringify(updatedStats));
        }
      }
      
      setStats(updatedStats);
    } catch (err) {
      console.error('Error updating statistics:', err);
      setError(err instanceof Error ? err : new Error('Failed to update statistics'));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset progress (mainly for testing)
  const resetProgress = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Reset to defaults
      if (isGuestMode) {
        await AsyncStorage.setItem('guest_statistics', JSON.stringify(defaultUserStats));
      } else if (isAuthenticated && user) {
        const { error } = await supabase
          .from('user_statistics')
          .update({ statistics: defaultUserStats })
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
      setStats(defaultUserStats);
    } catch (err) {
      console.error('Error resetting statistics:', err);
      setError(err instanceof Error ? err : new Error('Failed to reset statistics'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch statistics when the component mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated || isGuestMode) {
      fetchStats();
    }
  }, [isAuthenticated, isGuestMode]);

  // Update stats whenever meals change
  useEffect(() => {
    if (isAuthenticated || isGuestMode) {
      // Only update if it's a new day or meals have changed
      const today = new Date().toISOString().split('T')[0];
      if (stats.lastUpdated !== today || meals.length > 0) {
        updateDailyStats();
      }
    }
  }, [meals, isAuthenticated, isGuestMode]);

  // Context value
  const value = {
    stats,
    isLoading,
    error,
    fetchStats,
    updateDailyStats,
    resetProgress,
  };

  return <StatisticsContext.Provider value={value}>{children}</StatisticsContext.Provider>;
}

// Custom hook to use the statistics context
export function useStatistics() {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
}
