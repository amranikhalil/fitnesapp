import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../auth';
import * as healthGoalService from '../services/health-goal-service';
import { HealthGoal, GoalType, ActivityLevel, Gender } from '../services/api-types';

// Define context interface
interface HealthGoalsContextType {
  healthGoal: HealthGoal | null;
  isLoading: boolean;
  error: Error | null;
  fetchHealthGoal: () => Promise<void>;
  createHealthGoal: (goal: HealthGoal) => Promise<HealthGoal | null>;
  updateHealthGoal: (id: string, goal: Partial<HealthGoal>) => Promise<HealthGoal | null>;
  deleteHealthGoal: (id: string) => Promise<boolean>;
  // Calculated helpers
  calculateBMI: () => number | null;
  calculateRecommendedCalories: () => number | null;
}

// Create context
const HealthGoalsContext = createContext<HealthGoalsContextType | undefined>(undefined);

// Provider component
export function HealthGoalsProvider({ children }: { children: ReactNode }) {
  const [healthGoal, setHealthGoal] = useState<HealthGoal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { user, isAuthenticated, isGuestMode } = useAuth();

  // Fetch health goal from the API
  const fetchHealthGoal = async () => {
    if (!isAuthenticated && !isGuestMode) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, use default values or retrieve from local storage
        const defaultGoal: HealthGoal = {
          goal_type: 'maintain',
          daily_calorie_target: 2000,
        };
        setHealthGoal(defaultGoal);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await healthGoalService.fetchHealthGoal();
      
      if (error) {
        throw error;
      }
      
      setHealthGoal(data);
    } catch (err) {
      console.error('Error fetching health goal:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch health goal'));
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new health goal
  const createHealthGoal = async (goal: HealthGoal): Promise<HealthGoal | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        const newGoal = {
          ...goal,
          id: Date.now().toString()
        };
        setHealthGoal(newGoal);
        return newGoal;
      }
      
      const { data, error } = await healthGoalService.createHealthGoal(goal);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setHealthGoal(data);
        return data;
      }
      
      return null;
    } catch (err) {
      console.error('Error creating health goal:', err);
      setError(err instanceof Error ? err : new Error('Failed to create health goal'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing health goal
  const updateHealthGoal = async (id: string, goal: Partial<HealthGoal>): Promise<HealthGoal | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        if (healthGoal) {
          const updatedGoal = { ...healthGoal, ...goal };
          setHealthGoal(updatedGoal);
          return updatedGoal;
        }
        return null;
      }
      
      const { data, error } = await healthGoalService.updateHealthGoal(id, goal);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setHealthGoal(data);
        return data;
      }
      
      return null;
    } catch (err) {
      console.error('Error updating health goal:', err);
      setError(err instanceof Error ? err : new Error('Failed to update health goal'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a health goal
  const deleteHealthGoal = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        setHealthGoal(null);
        return true;
      }
      
      const { data, error } = await healthGoalService.deleteHealthGoal(id);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setHealthGoal(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error deleting health goal:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete health goal'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate BMI based on current health goal data
  const calculateBMI = (): number | null => {
    if (!healthGoal || !healthGoal.height || !healthGoal.current_weight) {
      return null;
    }
    
    // BMI formula: weight (kg) / (height (m) * height (m))
    // Assuming height is stored in cm
    const heightInMeters = healthGoal.height / 100;
    return healthGoal.current_weight / (heightInMeters * heightInMeters);
  };

  // Calculate recommended calories based on health goal data
  const calculateRecommendedCalories = (): number | null => {
    if (!healthGoal || !healthGoal.gender || !healthGoal.age || !healthGoal.height || !healthGoal.current_weight || !healthGoal.activity_level) {
      return healthGoal?.daily_calorie_target || null;
    }
    
    // Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
    let bmr = 0;
    if (healthGoal.gender === 'male') {
      bmr = 10 * healthGoal.current_weight + 6.25 * healthGoal.height - 5 * healthGoal.age + 5;
    } else {
      bmr = 10 * healthGoal.current_weight + 6.25 * healthGoal.height - 5 * healthGoal.age - 161;
    }
    
    // Apply activity multiplier
    let activityMultiplier = 1.2; // Sedentary
    if (healthGoal.activity_level === 'moderate') {
      activityMultiplier = 1.55;
    } else if (healthGoal.activity_level === 'active') {
      activityMultiplier = 1.725;
    }
    
    let tdee = bmr * activityMultiplier; // Total Daily Energy Expenditure
    
    // Adjust based on goal
    if (healthGoal.goal_type === 'lose') {
      tdee -= 500; // Create a deficit for weight loss
    } else if (healthGoal.goal_type === 'gain') {
      tdee += 500; // Create a surplus for weight gain
    }
    
    return Math.round(tdee);
  };

  // Fetch health goal when user is authenticated
  useEffect(() => {
    if (isAuthenticated || isGuestMode) {
      fetchHealthGoal();
    }
  }, [isAuthenticated, isGuestMode]);

  // Context value
  const value = {
    healthGoal,
    isLoading,
    error,
    fetchHealthGoal,
    createHealthGoal,
    updateHealthGoal,
    deleteHealthGoal,
    calculateBMI,
    calculateRecommendedCalories,
  };

  return <HealthGoalsContext.Provider value={value}>{children}</HealthGoalsContext.Provider>;
}

// Custom hook to use the health goals context
export function useHealthGoals() {
  const context = useContext(HealthGoalsContext);
  if (context === undefined) {
    throw new Error('useHealthGoals must be used within a HealthGoalsProvider');
  }
  return context;
}
