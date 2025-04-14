import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealProgram, getRecommendedPrograms } from './meal-programs';

export interface UserMetrics {
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  goal: string;
  targetCalories: number;
}

interface ProgramsContextType {
  userMetrics: UserMetrics | null;
  selectedProgram: MealProgram | null;
  setUserMetrics: (metrics: UserMetrics) => Promise<void>;
  getRecommendedProgramsForUser: () => MealProgram[];
  selectProgram: (programId: string) => Promise<void>;
  clearSelectedProgram: () => Promise<void>;
}

// Create context
const ProgramsContext = createContext<ProgramsContextType | undefined>(undefined);

// Default user metrics
const defaultUserMetrics: UserMetrics = {
  weight: 70,
  height: 170,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  targetCalories: 2000,
};

// Provider component
export function ProgramsProvider({ children }: { children: ReactNode }) {
  const [userMetrics, setUserMetricsState] = useState<UserMetrics | null>(null);
  const [selectedProgram, setSelectedProgramState] = useState<MealProgram | null>(null);

  // Load saved data when the component mounts
  React.useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Load user metrics
        const savedUserMetrics = await AsyncStorage.getItem('userMetrics');
        if (savedUserMetrics) {
          setUserMetricsState(JSON.parse(savedUserMetrics));
        }

        // Load selected program
        const savedProgramId = await AsyncStorage.getItem('selectedProgramId');
        if (savedProgramId) {
          const programsJson = await AsyncStorage.getItem('programs');
          if (programsJson) {
            const programs = JSON.parse(programsJson) as MealProgram[];
            const program = programs.find(p => p.id === savedProgramId);
            if (program) {
              setSelectedProgramState(program);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved program data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Set user metrics and save to AsyncStorage
  const setUserMetrics = async (metrics: UserMetrics) => {
    try {
      await AsyncStorage.setItem('userMetrics', JSON.stringify(metrics));
      setUserMetricsState(metrics);
    } catch (error) {
      console.error('Error saving user metrics:', error);
    }
  };

  // Get recommended programs based on user metrics
  const getRecommendedProgramsForUser = (): MealProgram[] => {
    // Import all meal programs
    const { mealPrograms } = require('./meal-programs');
    
    // If user metrics aren't available, return all programs
    if (!userMetrics) {
      console.log('No user metrics available, returning all programs');
      return mealPrograms;
    }
    
    try {
      // Try to get recommended programs based on user metrics
      return getRecommendedPrograms(userMetrics);
    } catch (error) {
      console.error('Error getting recommended programs:', error);
      // Return all programs as fallback
      return mealPrograms;
    }
  };

  // Select and save a program
  const selectProgram = async (programId: string) => {
    try {
      // Get recommended programs
      const programs = getRecommendedProgramsForUser();
      
      // Find the selected program
      const program = programs.find(p => p.id === programId);
      
      if (program) {
        // Save program ID
        await AsyncStorage.setItem('selectedProgramId', program.id);
        
        // Save all programs for reference (in case we need to retrieve it later)
        await AsyncStorage.setItem('programs', JSON.stringify(programs));
        
        // Update state
        setSelectedProgramState(program);
      }
    } catch (error) {
      console.error('Error selecting program:', error);
    }
  };

  // Clear selected program
  const clearSelectedProgram = async () => {
    try {
      await AsyncStorage.removeItem('selectedProgramId');
      setSelectedProgramState(null);
    } catch (error) {
      console.error('Error clearing selected program:', error);
    }
  };

  const value = {
    userMetrics,
    selectedProgram,
    setUserMetrics,
    getRecommendedProgramsForUser,
    selectProgram,
    clearSelectedProgram,
  };

  return <ProgramsContext.Provider value={value}>{children}</ProgramsContext.Provider>;
}

// Custom hook to use the programs context
export function usePrograms() {
  const context = useContext(ProgramsContext);
  if (context === undefined) {
    throw new Error('usePrograms must be used within a ProgramsProvider');
  }
  return context;
}
