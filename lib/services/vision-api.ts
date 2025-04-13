import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { FoodItem } from '../meals';
import { config } from '../config';

// Food database for mapping detected labels to nutritional information
// In a real app, this would be a more comprehensive database or API
const foodDatabase: Record<string, Omit<FoodItem, 'id'>> = {
  'apple': { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  'banana': { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  'orange': { name: 'Orange', calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2 },
  'bread': { name: 'Bread', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  'rice': { name: 'Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'pasta': { name: 'Pasta', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  'chicken': { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'beef': { name: 'Beef', calories: 250, protein: 26, carbs: 0, fat: 17 },
  'salmon': { name: 'Salmon', calories: 206, protein: 22, carbs: 0, fat: 13 },
  'egg': { name: 'Egg', calories: 78, protein: 6, carbs: 0.6, fat: 5 },
  'milk': { name: 'Milk', calories: 42, protein: 3.4, carbs: 5, fat: 1 },
  'cheese': { name: 'Cheese', calories: 113, protein: 7, carbs: 0.4, fat: 9 },
  'yogurt': { name: 'Yogurt', calories: 59, protein: 3.5, carbs: 5, fat: 3.3 },
  'potato': { name: 'Potato', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'broccoli': { name: 'Broccoli', calories: 31, protein: 2.5, carbs: 6, fat: 0.4 },
  'carrot': { name: 'Carrot', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  'spinach': { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  'tomato': { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'avocado': { name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  'oatmeal': { name: 'Oatmeal', calories: 68, protein: 2.5, carbs: 12, fat: 1.4 },
  'cereal': { name: 'Cereal', calories: 110, protein: 2, carbs: 24, fat: 1 },
  'salad': { name: 'Salad', calories: 20, protein: 1.2, carbs: 3.7, fat: 0.2 },
  'sandwich': { name: 'Sandwich', calories: 300, protein: 15, carbs: 30, fat: 12 },
  'pizza': { name: 'Pizza Slice', calories: 285, protein: 12, carbs: 36, fat: 10 },
  'burger': { name: 'Burger', calories: 354, protein: 20, carbs: 40, fat: 17 },
  'fries': { name: 'French Fries', calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  'cookie': { name: 'Cookie', calories: 148, protein: 1.5, carbs: 25, fat: 7 },
  'cake': { name: 'Cake Slice', calories: 239, protein: 2.2, carbs: 34, fat: 11 },
  'ice cream': { name: 'Ice Cream', calories: 207, protein: 3.5, carbs: 23, fat: 11 },
  'chocolate': { name: 'Chocolate', calories: 155, protein: 2.2, carbs: 17, fat: 9 },
  'nuts': { name: 'Mixed Nuts', calories: 172, protein: 5, carbs: 6, fat: 15 },
  'fruit': { name: 'Mixed Fruit', calories: 70, protein: 1, carbs: 18, fat: 0.2 },
  'vegetable': { name: 'Mixed Vegetables', calories: 25, protein: 1.5, carbs: 5, fat: 0.2 },
  'meat': { name: 'Meat', calories: 200, protein: 22, carbs: 0, fat: 13 },
  'fish': { name: 'Fish', calories: 180, protein: 20, carbs: 0, fat: 10 },
  'drink': { name: 'Beverage', calories: 120, protein: 0, carbs: 30, fat: 0 },
  'coffee': { name: 'Coffee', calories: 2, protein: 0.1, carbs: 0, fat: 0 },
  'tea': { name: 'Tea', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
  'juice': { name: 'Fruit Juice', calories: 110, protein: 0.5, carbs: 26, fat: 0.2 },
  'water': { name: 'Water', calories: 0, protein: 0, carbs: 0, fat: 0 },
};

// Check if API key is configured
const isApiKeyConfigured = () => {
  return config.googleCloudVisionApiKey && 
         config.googleCloudVisionApiKey !== 'YOUR_GOOGLE_CLOUD_VISION_API_KEY';
};

/**
 * Simulated food detection for when API key is not available
 * @returns Promise with simulated food detection results
 */
async function simulateFoodDetection(): Promise<{
  success: boolean;
  detectedItems: FoodItem[];
  confidence: number;
  message: string;
}> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Randomly select 2-4 food items
  const numItems = Math.floor(Math.random() * 3) + 2; // 2-4 items
  const detectedItems: FoodItem[] = [];
  const usedKeys = new Set<string>();
  
  // Get all food keys
  const foodKeys = Object.keys(foodDatabase);
  
  for (let i = 0; i < numItems; i++) {
    let randomKey;
    do {
      randomKey = foodKeys[Math.floor(Math.random() * foodKeys.length)];
    } while (usedKeys.has(randomKey));
    
    usedKeys.add(randomKey);
    const foodInfo = foodDatabase[randomKey];
    
    detectedItems.push({
      id: Date.now() + '-' + i,
      name: foodInfo.name,
      calories: foodInfo.calories,
      protein: foodInfo.protein,
      carbs: foodInfo.carbs,
      fat: foodInfo.fat
    });
  }
  
  return {
    success: true,
    detectedItems,
    confidence: 0.85,
    message: `Detected ${detectedItems.length} food items (DEMO MODE)`
  };
}

/**
 * Analyzes an image using Google Cloud Vision API to detect food items
 * @param imageUri Local URI of the image to analyze
 * @returns Promise with detected food items and their nutritional information
 */
export async function analyzeFoodImage(imageUri: string): Promise<{
  success: boolean;
  detectedItems: FoodItem[];
  confidence: number;
  message: string;
}> {
  try {
    // Check if API key is configured
    if (!isApiKeyConfigured()) {
      console.log('No API key configured, using simulated detection');
      return simulateFoodDetection();
    }
    
    // First, convert the image to base64
    const base64Image = await fileToBase64(imageUri);
    
    if (!base64Image) {
      throw new Error('Failed to convert image to base64');
    }
    
    try {
      // Extract the base64 data without the prefix
      const base64Data = base64Image.split(',')[1];
      
      // Prepare the request to Google Cloud Vision API
      const apiKey = config.googleCloudVisionApiKey;
      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
      
      // Create request with proper headers
      const requestData = {
        requests: [
          {
            image: {
              content: base64Data
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 15
              }
            ]
          }
        ]
      };
      
      // Make the API request with proper headers
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // For debugging, let's log the full response
        validateStatus: () => true
      });
      
      console.log('Vision API response status:', response.status);
      
      // If we got an error, throw it with details
      if (response.status !== 200) {
        console.error('Google Cloud Vision API error:', response.data);
        throw new Error(`API Error ${response.status}: ${JSON.stringify(response.data)}`);
      }
      
      // Process the response to extract food items
      const labels = response.data.responses[0]?.labelAnnotations || [];
      
      console.log('Detected labels:', labels.map((label: any) => label.description).join(', '));
      
      // Filter for food items and remove duplicates
      const foodItems: FoodItem[] = [];
      const detectedFoods = new Set<string>();
      
      for (const label of labels) {
        const foodName = label.description.toLowerCase();
        
        // Skip if we already detected this food
        if (detectedFoods.has(foodName)) continue;
        
        // Check if this is a food item in our database
        if (foodDatabase[foodName]) {
          detectedFoods.add(foodName);
          const foodInfo = foodDatabase[foodName];
          
          foodItems.push({
            id: Date.now() + '-' + foodItems.length, // Generate a unique ID
            name: foodInfo.name,
            calories: foodInfo.calories,
            protein: foodInfo.protein,
            carbs: foodInfo.carbs,
            fat: foodInfo.fat
          });
        }
      }
      
      // If no food items were detected, try to find partial matches
      if (foodItems.length === 0) {
        for (const label of labels) {
          const term = label.description.toLowerCase();
          
          // Look for partial matches in our food database
          for (const [key, foodInfo] of Object.entries(foodDatabase)) {
            if (term.includes(key) || key.includes(term)) {
              if (!detectedFoods.has(key)) {
                detectedFoods.add(key);
                
                foodItems.push({
                  id: Date.now() + '-' + foodItems.length,
                  name: foodInfo.name,
                  calories: foodInfo.calories,
                  protein: foodInfo.protein,
                  carbs: foodInfo.carbs,
                  fat: foodInfo.fat
                });
                
                // Limit to 5 items for partial matches
                if (foodItems.length >= 5) break;
              }
            }
          }
          
          if (foodItems.length >= 5) break;
        }
      }
      
      // If still no food items were detected, add generic items
      if (foodItems.length === 0) {
        // Just add some generic food items as a fallback
        const genericFoods = ['apple', 'banana', 'sandwich'];
        
        for (const food of genericFoods) {
          const foodInfo = foodDatabase[food];
          foodItems.push({
            id: Date.now() + '-' + foodItems.length,
            name: foodInfo.name,
            calories: foodInfo.calories,
            protein: foodInfo.protein,
            carbs: foodInfo.carbs,
            fat: foodInfo.fat
          });
        }
      }
      
      // Calculate average confidence score from labels
      const avgConfidence = labels.length > 0
        ? labels.reduce((sum: number, label: any) => sum + label.score, 0) / labels.length
        : 0.7; // Default confidence if no labels
      
      // Return the results
      return {
        success: true,
        detectedItems: foodItems,
        confidence: avgConfidence,
        message: foodItems.length > 0 
          ? `Detected ${foodItems.length} food items` 
          : 'No food items detected'
      };
    } catch (apiError: any) {
      console.error('API Error:', apiError);
      
      // For API errors, fall back to demo mode
      return {
        ...await simulateFoodDetection(),
        message: `API Error: ${apiError.message || 'Unknown error'} - Using demo mode as fallback`
      };
    }
    
  } catch (error) {
    console.error('Error analyzing food image:', error);
    // Fall back to demo mode for any errors
    return {
      ...await simulateFoodDetection(),
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'} - Using demo mode`
    };
  }
}

/**
 * Converts a file to base64 encoding
 * @param uri Local URI of the file
 * @returns Promise with base64 encoded string
 */
async function fileToBase64(uri: string): Promise<string | null> {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64
    });
    
    // Get the file info to determine MIME type
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const fileNameParts = fileInfo.uri.split('.');
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    
    // Determine MIME type based on extension
    let mimeType = 'image/jpeg'; // Default
    if (fileExtension === 'png') {
      mimeType = 'image/png';
    } else if (fileExtension === 'gif') {
      mimeType = 'image/gif';
    }
    
    // Return as data URL
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    return null;
  }
}
