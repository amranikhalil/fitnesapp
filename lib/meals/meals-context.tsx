import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../auth';
import * as mealService from '../services/meal-service';
import * as dailyLogService from '../services/daily-log-service';
import { Meal as DBMeal, FoodItem as DBFoodItem } from '../services/api-types';

// Define meal and food item interfaces for the frontend
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string; // Optional serving size information
  quantity?: number;
  unit?: string;
  is_ai_generated?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  items: FoodItem[];
  image?: string; // Optional meal image URI
  notes?: string;
  meal_type?: string;
  meal_date?: string;
}

// Define context interface
interface MealsContextType {
  meals: Meal[];
  isLoading: boolean;
  error: Error | null;
  fetchMeals: (date?: string) => Promise<void>;
  addMeal: (meal: Meal) => Promise<Meal | null>;
  updateMeal: (id: string, updatedMeal: Meal) => Promise<Meal | null>;
  deleteMeal: (id: string) => Promise<boolean>;
  addFoodItem: (mealId: string, foodItem: FoodItem) => Promise<FoodItem | null>;
  removeFoodItem: (foodItemId: string) => Promise<boolean>;
  uploadMealImage: (uri: string, mealId: string) => Promise<string | null>;
  dailyCalorieTarget: number;
  setDailyCalorieTarget: (target: number) => void;
  dailyNutrition: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Create context
const MealsContext = createContext<MealsContextType | undefined>(undefined);

// Helper function to convert DB meal to frontend meal
const convertDBMealToMeal = (dbMeal: DBMeal, foodItems: DBFoodItem[] = []): Meal => {
  return {
    id: dbMeal.id || '',
    name: dbMeal.name,
    time: dbMeal.meal_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    calories: dbMeal.total_calories,
    meal_type: dbMeal.meal_type,
    meal_date: dbMeal.meal_date,
    notes: dbMeal.notes,
    image: dbMeal.image_url,
    items: foodItems.map(item => ({
      id: item.id || '',
      name: item.name,
      calories: item.calories,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      quantity: item.quantity,
      unit: item.unit,
      is_ai_generated: item.is_ai_generated
    }))
  };
};

// Provider component
export function MealsProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(2000);
  const [dailyNutrition, setDailyNutrition] = useState({
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  const { user, isAuthenticated, isGuestMode } = useAuth();

  // Fetch meals from the API
  const fetchMeals = async (date?: string) => {
    if (!isAuthenticated && !isGuestMode) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, use mock data or local storage
        // For simplicity, we'll just keep the current state
        setIsLoading(false);
        return;
      }
      
      const formattedDate = date || new Date().toISOString().split('T')[0];
      const { data, error } = await mealService.fetchMealsByDate(formattedDate);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Convert DB meals to frontend meals
        const convertedMeals = data.map(dbMeal => {
          return convertDBMealToMeal(dbMeal, dbMeal.items);
        });
        
        setMeals(convertedMeals);
        
        // Calculate daily nutrition
        const totalProtein = data.reduce((sum, meal) => sum + (meal.total_protein || 0), 0);
        const totalCarbs = data.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0);
        const totalFat = data.reduce((sum, meal) => sum + (meal.total_fat || 0), 0);
        
        setDailyNutrition({
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat
        });
        
        // Update daily log with nutrition data
        await dailyLogService.updateDailyLogNutrition(formattedDate);
      } else {
        setMeals([]);
        setDailyNutrition({ protein: 0, carbs: 0, fat: 0 });
      }
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch meals'));
    } finally {
      setIsLoading(false);
    }
  };

  // Add meal
  const addMeal = async (meal: Meal): Promise<Meal | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        const newMeal = {
          ...meal,
          id: Date.now().toString()
        };
        setMeals(currentMeals => [newMeal, ...currentMeals]);
        return newMeal;
      }
      
      // Calculate totals for the meal
      const totalCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = meal.items.reduce((sum, item) => sum + (item.protein || 0), 0);
      const totalCarbs = meal.items.reduce((sum, item) => sum + (item.carbs || 0), 0);
      const totalFat = meal.items.reduce((sum, item) => sum + (item.fat || 0), 0);
      
      // Convert frontend meal to DB meal
      const dbMeal: DBMeal = {
        name: meal.name,
        meal_type: (meal.meal_type as any) || 'snack',
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        notes: meal.notes,
        image_url: meal.image,
        meal_date: meal.meal_date || new Date().toISOString().split('T')[0],
        meal_time: meal.time
      };
      
      // Convert frontend food items to DB food items
      const dbFoodItems: DBFoodItem[] = meal.items.map(item => ({
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        quantity: item.quantity || 1,
        unit: item.unit,
        is_ai_generated: item.is_ai_generated || false,
        meal_id: '' // This will be set by the service
      }));
      
      const { data, error } = await mealService.createMeal(dbMeal, dbFoodItems);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const newMeal = convertDBMealToMeal(data, data.items);
        setMeals(currentMeals => [newMeal, ...currentMeals]);
        return newMeal;
      }
      
      return null;
    } catch (err) {
      console.error('Error adding meal:', err);
      setError(err instanceof Error ? err : new Error('Failed to add meal'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update meal
  const updateMeal = async (id: string, updatedMeal: Meal): Promise<Meal | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        setMeals(currentMeals =>
          currentMeals.map(meal => (meal.id === id ? updatedMeal : meal))
        );
        return updatedMeal;
      }
      
      // Calculate totals for the meal
      const totalCalories = updatedMeal.items.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = updatedMeal.items.reduce((sum, item) => sum + (item.protein || 0), 0);
      const totalCarbs = updatedMeal.items.reduce((sum, item) => sum + (item.carbs || 0), 0);
      const totalFat = updatedMeal.items.reduce((sum, item) => sum + (item.fat || 0), 0);
      
      // Update the meal
      const { data, error } = await mealService.updateMeal(id, {
        name: updatedMeal.name,
        meal_type: (updatedMeal.meal_type as any) || 'snack',
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        notes: updatedMeal.notes,
        meal_date: updatedMeal.meal_date,
        meal_time: updatedMeal.time
      });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Refresh meals to get updated data
        await fetchMeals(data.meal_date);
        
        return {
          ...updatedMeal,
          id: data.id || id
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error updating meal:', err);
      setError(err instanceof Error ? err : new Error('Failed to update meal'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete meal
  const deleteMeal = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        setMeals(currentMeals => currentMeals.filter(meal => meal.id !== id));
        return true;
      }
      
      // Find the meal to get its date for refreshing later
      const meal = meals.find(m => m.id === id);
      const mealDate = meal?.meal_date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await mealService.deleteMeal(id);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Refresh meals for the day
        await fetchMeals(mealDate);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete meal'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add food item
  const addFoodItem = async (mealId: string, foodItem: FoodItem): Promise<FoodItem | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        const updatedMeals = meals.map(meal => {
          if (meal.id === mealId) {
            const newItem = { ...foodItem, id: Date.now().toString() };
            return {
              ...meal,
              items: [...meal.items, newItem],
              calories: meal.calories + foodItem.calories
            };
          }
          return meal;
        });
        
        setMeals(updatedMeals);
        return { ...foodItem, id: Date.now().toString() };
      }
      
      // Convert frontend food item to DB food item
      const dbFoodItem: DBFoodItem = {
        meal_id: mealId,
        name: foodItem.name,
        calories: foodItem.calories,
        protein: foodItem.protein,
        carbs: foodItem.carbs,
        fat: foodItem.fat,
        quantity: foodItem.quantity || 1,
        unit: foodItem.unit,
        is_ai_generated: foodItem.is_ai_generated || false
      };
      
      const { data, error } = await mealService.addFoodItemToMeal(mealId, dbFoodItem);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Find the meal to get its date for refreshing
        const meal = meals.find(m => m.id === mealId);
        const mealDate = meal?.meal_date || new Date().toISOString().split('T')[0];
        
        // Refresh meals to get updated data
        await fetchMeals(mealDate);
        
        return {
          id: data.id || '',
          name: data.name,
          calories: data.calories,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          quantity: data.quantity,
          unit: data.unit,
          is_ai_generated: data.is_ai_generated
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error adding food item:', err);
      setError(err instanceof Error ? err : new Error('Failed to add food item'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove food item
  const removeFoodItem = async (foodItemId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        const updatedMeals = meals.map(meal => {
          const foundItem = meal.items.find(item => item.id === foodItemId);
          
          if (foundItem) {
            return {
              ...meal,
              items: meal.items.filter(item => item.id !== foodItemId),
              calories: meal.calories - foundItem.calories
            };
          }
          
          return meal;
        });
        
        setMeals(updatedMeals);
        return true;
      }
      
      const { data, error } = await mealService.removeFoodItemFromMeal(foodItemId);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Find which meal this food item belongs to
        let mealDate = new Date().toISOString().split('T')[0];
        for (const meal of meals) {
          if (meal.items.some(item => item.id === foodItemId)) {
            mealDate = meal.meal_date || mealDate;
            break;
          }
        }
        
        // Refresh meals to get updated data
        await fetchMeals(mealDate);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error removing food item:', err);
      setError(err instanceof Error ? err : new Error('Failed to remove food item'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload meal image
  const uploadMealImage = async (uri: string, mealId: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isGuestMode) {
        // In guest mode, just update local state
        const updatedMeals = meals.map(meal => {
          if (meal.id === mealId) {
            return { ...meal, image: uri };
          }
          return meal;
        });
        
        setMeals(updatedMeals);
        return uri;
      }
      
      const { data, error } = await mealService.uploadMealImage(uri, mealId);
      
      if (error) {
        throw error;
      }
      
      if (data && data.image_url) {
        // Update in state
        const updatedMeals = meals.map(meal => {
          if (meal.id === mealId) {
            return { ...meal, image: data.image_url };
          }
          return meal;
        });
        
        setMeals(updatedMeals);
        return data.image_url;
      }
      
      return null;
    } catch (err) {
      console.error('Error uploading meal image:', err);
      setError(err instanceof Error ? err : new Error('Failed to upload meal image'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch meals when user is authenticated
  useEffect(() => {
    if (isAuthenticated || isGuestMode) {
      fetchMeals();
    }
  }, [isAuthenticated, isGuestMode]);

  // Context value
  const value = {
    meals,
    isLoading,
    error,
    fetchMeals,
    addMeal,
    updateMeal,
    deleteMeal,
    addFoodItem,
    removeFoodItem,
    uploadMealImage,
    dailyCalorieTarget,
    setDailyCalorieTarget,
    dailyNutrition
  };

  return <MealsContext.Provider value={value}>{children}</MealsContext.Provider>;
}

// Custom hook to use the meals context
export function useMeals() {
  const context = useContext(MealsContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
}
