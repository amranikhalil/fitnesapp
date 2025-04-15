import { supabase } from '../supabase';
import { Meal, FoodItem, MealType } from './api-types';

/**
 * Fetches meals for the current user for a specific date
 */
export async function fetchMealsByDate(date: string = new Date().toISOString().split('T')[0]) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // First get the meals
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('meal_date', date)
      .order('meal_time', { ascending: true });
      
    if (mealsError) {
      throw mealsError;
    }
    
    // Now for each meal, get its food items
    if (meals && meals.length > 0) {
      const mealsWithItems = await Promise.all(meals.map(async (meal) => {
        const { data: foodItems, error: foodItemsError } = await supabase
          .from('food_items')
          .select('*')
          .eq('meal_id', meal.id);
          
        if (foodItemsError) {
          console.error(`Error fetching food items for meal ${meal.id}:`, foodItemsError);
          return { ...meal, items: [] };
        }
        
        return { ...meal, items: foodItems || [] };
      }));
      
      return { data: mealsWithItems, error: null };
    }
    
    return { data: [], error: null };
  } catch (error) {
    console.error('Error fetching meals:', error);
    return { data: [], error };
  }
}

/**
 * Creates a new meal and its food items
 */
export async function createMeal(meal: Meal, foodItems: FoodItem[]) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // Set meal date and time if not provided
    const now = new Date();
    const mealData = {
      ...meal,
      user_id: user.user.id,
      meal_date: meal.meal_date || now.toISOString().split('T')[0],
      meal_time: meal.meal_time || now.toTimeString().split(' ')[0]
    };
    
    // Begin a transaction by starting a single batch
    // Insert the meal first
    const { data: newMeal, error: mealError } = await supabase
      .from('meals')
      .insert(mealData)
      .select()
      .single();
    
    if (mealError) {
      throw mealError;
    }
    
    if (!newMeal) {
      throw new Error('Failed to create meal');
    }
    
    // Now insert all food items with the new meal ID
    if (foodItems.length > 0) {
      const foodItemsWithMealId = foodItems.map(item => ({
        ...item,
        meal_id: newMeal.id
      }));
      
      const { data: newFoodItems, error: foodItemsError } = await supabase
        .from('food_items')
        .insert(foodItemsWithMealId)
        .select();
      
      if (foodItemsError) {
        // If there's an error with food items, we should ideally roll back the meal insertion
        // but Supabase doesn't support transactions in the client, so we'll delete the meal
        await supabase.from('meals').delete().eq('id', newMeal.id);
        throw foodItemsError;
      }
      
      return { data: { ...newMeal, items: newFoodItems }, error: null };
    }
    
    return { data: { ...newMeal, items: [] }, error: null };
  } catch (error) {
    console.error('Error creating meal:', error);
    return { data: null, error };
  }
}

/**
 * Updates an existing meal
 */
export async function updateMeal(id: string, meal: Partial<Meal>) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('meals')
      .update(meal)
      .eq('id', id)
      .eq('user_id', user.user.id) // Ensure the user can only update their own meals
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating meal:', error);
    return { data: null, error };
  }
}

/**
 * Deletes a meal and all associated food items
 */
export async function deleteMeal(id: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // Delete associated food items first (they will be automatically deleted via cascade
    // in the database, but we'll do it here for completeness)
    await supabase
      .from('food_items')
      .delete()
      .eq('meal_id', id);
    
    // Then delete the meal
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id); // Ensure the user can only delete their own meals
    
    if (error) {
      throw error;
    }
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting meal:', error);
    return { data: null, error };
  }
}

/**
 * Adds a food item to a meal
 */
export async function addFoodItemToMeal(mealId: string, foodItem: FoodItem) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // First verify the meal belongs to the user
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select('id')
      .eq('id', mealId)
      .eq('user_id', user.user.id)
      .single();
    
    if (mealError) {
      throw mealError;
    }
    
    if (!meal) {
      throw new Error('Meal not found or does not belong to the user');
    }
    
    // Then add the food item
    const { data, error } = await supabase
      .from('food_items')
      .insert({ ...foodItem, meal_id: mealId })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Update the meal's total nutrition information
    const { data: updatedMeal, error: updateError } = await supabase.rpc('update_meal_nutrition', {
      p_meal_id: mealId
    });
    
    if (updateError) {
      console.error('Error updating meal nutrition:', updateError);
      // Continue despite the error, as the food item was added successfully
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error adding food item:', error);
    return { data: null, error };
  }
}

/**
 * Removes a food item from a meal
 */
export async function removeFoodItemFromMeal(foodItemId: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // First get the meal_id from the food item
    const { data: foodItem, error: foodItemError } = await supabase
      .from('food_items')
      .select('meal_id')
      .eq('id', foodItemId)
      .single();
    
    if (foodItemError) {
      throw foodItemError;
    }
    
    if (!foodItem) {
      throw new Error('Food item not found');
    }
    
    // Verify the meal belongs to the user
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select('id')
      .eq('id', foodItem.meal_id)
      .eq('user_id', user.user.id)
      .single();
    
    if (mealError) {
      throw mealError;
    }
    
    if (!meal) {
      throw new Error('Meal not found or does not belong to the user');
    }
    
    // Delete the food item
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', foodItemId);
    
    if (error) {
      throw error;
    }
    
    // Update the meal's total nutrition information
    const { data: updatedMeal, error: updateError } = await supabase.rpc('update_meal_nutrition', {
      p_meal_id: foodItem.meal_id
    });
    
    if (updateError) {
      console.error('Error updating meal nutrition:', updateError);
      // Continue despite the error, as the food item was removed successfully
    }
    
    return { data: true, error: null };
  } catch (error) {
    console.error('Error removing food item:', error);
    return { data: null, error };
  }
}

/**
 * Uploads a meal image
 */
export async function uploadMealImage(uri: string, mealId: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // Verify the meal belongs to the user
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select('id')
      .eq('id', mealId)
      .eq('user_id', user.user.id)
      .single();
    
    if (mealError) {
      throw mealError;
    }
    
    if (!meal) {
      throw new Error('Meal not found or does not belong to the user');
    }
    
    // Convert image URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload to storage
    const fileExt = uri.split('.').pop();
    const fileName = `meal-${mealId}-${Date.now()}.${fileExt}`;
    const filePath = `meals/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('meals')
      .upload(filePath, blob);
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('meals')
      .getPublicUrl(filePath);
    
    // Update meal with new image URL
    const { data, error } = await supabase
      .from('meals')
      .update({ image_url: publicUrl })
      .eq('id', mealId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error uploading meal image:', error);
    return { data: null, error };
  }
}
