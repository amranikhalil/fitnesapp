// API Types based on Supabase schema

// User Profile Types
export interface Profile {
  id: string;
  created_at?: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  is_subscribed?: boolean;
  subscription_expires_at?: string;
  ai_credits?: number; // Number of AI analysis credits available
  daily_calories_target?: number; // Daily calorie target
  daily_protein_target?: number; // Daily protein target in grams
  daily_carbs_target?: number; // Daily carbs target in grams
  daily_fat_target?: number; // Daily fat target in grams
}

// Health Goal Types
export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'moderate' | 'active';
export type Gender = 'male' | 'female' | 'other';

export interface HealthGoal {
  id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  goal_type: GoalType;
  current_weight?: number;
  target_weight?: number;
  height?: number;
  age?: number;
  gender?: Gender;
  activity_level?: ActivityLevel;
  daily_calorie_target: number;
}

// Meal Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id?: string;
  user_id?: string;
  created_at?: string;
  meal_date?: string;
  meal_time?: string;
  meal_type: MealType;
  name: string;
  total_calories: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  image_url?: string;
  notes?: string;
}

// Food Item Types
export interface FoodItem {
  id?: string;
  meal_id: string;
  created_at?: string;
  name: string;
  quantity?: number;
  unit?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  is_ai_generated?: boolean;
}

// Common Food Types
export interface CommonFood {
  id?: string;
  created_at?: string;
  name: string;
  serving_size: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// Daily Log Types
export interface DailyLog {
  id?: string;
  user_id?: string;
  log_date: string;
  created_at?: string;
  updated_at?: string;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  weight_recorded?: number;
  notes?: string;
}
