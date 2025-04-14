import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define meal and food item interfaces
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string; // Optional serving size information
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  items: FoodItem[];
  image?: string; // Optional meal image URI
}

// Mock initial meals
const initialMeals: Meal[] = [
  {
    id: '1',
    name: 'Breakfast',
    time: '8:30 AM',
    calories: 450,
    items: [
      { id: '1', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 },
      { id: '2', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
      { id: '3', name: 'Almond Milk', calories: 30, protein: 1, carbs: 1, fat: 2.5 },
      { id: '4', name: 'Honey', calories: 65, protein: 0, carbs: 17, fat: 0 },
    ],
  },
  {
    id: '2',
    name: 'Lunch',
    time: '12:45 PM',
    calories: 620,
    items: [
      { id: '1', name: 'Chicken Salad', calories: 350, protein: 30, carbs: 10, fat: 20 },
      { id: '2', name: 'Whole Grain Bread', calories: 180, protein: 8, carbs: 33, fat: 2 },
      { id: '3', name: 'Apple', calories: 90, protein: 0, carbs: 25, fat: 0 },
    ],
  },
];

// Define context interface
interface MealsContextType {
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  updateMeal: (id: string, updatedMeal: Meal) => void;
  deleteMeal: (id: string) => void;
  dailyCalorieTarget: number;
  setDailyCalorieTarget: (target: number) => void;
}

// Create context
const MealsContext = createContext<MealsContextType | undefined>(undefined);

// Provider component
export function MealsProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(2000);

  const addMeal = (meal: Meal) => {
    setMeals((currentMeals) => [meal, ...currentMeals]);
  };

  const updateMeal = (id: string, updatedMeal: Meal) => {
    setMeals((currentMeals) =>
      currentMeals.map((meal) => (meal.id === id ? updatedMeal : meal))
    );
  };

  const deleteMeal = (id: string) => {
    setMeals((currentMeals) => currentMeals.filter((meal) => meal.id !== id));
  };

  const value = {
    meals,
    addMeal,
    updateMeal,
    deleteMeal,
    dailyCalorieTarget,
    setDailyCalorieTarget,
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
