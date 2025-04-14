/**
 * Meal program recommendation system
 * Provides personalized meal programs based on user goals and metrics
 */

export interface NutritionTarget {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
}

export interface MealProgramDay {
  day: string;
  meals: {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image?: string;
  }[];
}

export interface MealProgram {
  id: string;
  name: string;
  description: string;
  targetGoal: 'lose' | 'maintain' | 'gain';
  suitableFor: {
    activityLevels: string[];
    genders?: string[];
  };
  calorieRange: {
    min: number;
    max: number;
  };
  macroDistribution: {
    protein: number; // percentage
    carbs: number; // percentage
    fat: number; // percentage
  };
  sampleDays: MealProgramDay[];
  tags: string[];
}

// Sample meal programs based on common nutritional strategies
export const mealPrograms: MealProgram[] = [
  {
    id: 'balanced',
    name: 'Balanced Nutrition Plan',
    description: 'A well-rounded approach with balanced macronutrients suitable for most people',
    targetGoal: 'maintain',
    suitableFor: {
      activityLevels: ['sedentary', 'moderate', 'active'],
    },
    calorieRange: {
      min: 1800,
      max: 2500,
    },
    macroDistribution: {
      protein: 30,
      carbs: 45,
      fat: 25,
    },
    sampleDays: [
      {
        day: 'Monday',
        meals: [
          {
            name: 'Breakfast',
            description: 'Greek yogurt with berries and honey, whole grain toast',
            calories: 450,
            protein: 25,
            carbs: 60,
            fat: 12,
          },
          {
            name: 'Lunch',
            description: 'Grilled chicken salad with olive oil dressing and quinoa',
            calories: 550,
            protein: 35,
            carbs: 40,
            fat: 20,
          },
          {
            name: 'Dinner',
            description: 'Baked salmon with roasted vegetables and brown rice',
            calories: 650,
            protein: 40,
            carbs: 50,
            fat: 25,
          },
          {
            name: 'Snack',
            description: 'Apple with almond butter',
            calories: 250,
            protein: 8,
            carbs: 25,
            fat: 12,
          },
        ],
      },
    ],
    tags: ['balanced', 'sustainable', 'beginner-friendly'],
  },
  {
    id: 'high-protein',
    name: 'High Protein Plan',
    description: 'Higher protein intake to support muscle recovery and growth',
    targetGoal: 'gain',
    suitableFor: {
      activityLevels: ['moderate', 'active'],
    },
    calorieRange: {
      min: 2200,
      max: 3000,
    },
    macroDistribution: {
      protein: 40,
      carbs: 40,
      fat: 20,
    },
    sampleDays: [
      {
        day: 'Monday',
        meals: [
          {
            name: 'Breakfast',
            description: 'Protein smoothie with banana, protein powder, and oats',
            calories: 550,
            protein: 40,
            carbs: 60,
            fat: 10,
          },
          {
            name: 'Lunch',
            description: 'Turkey and avocado wrap with side of cottage cheese',
            calories: 650,
            protein: 45,
            carbs: 45,
            fat: 25,
          },
          {
            name: 'Dinner',
            description: 'Steak with sweet potato and steamed broccoli',
            calories: 750,
            protein: 50,
            carbs: 50,
            fat: 25,
          },
          {
            name: 'Snack',
            description: 'Protein bar and banana',
            calories: 300,
            protein: 20,
            carbs: 30,
            fat: 8,
          },
        ],
      },
    ],
    tags: ['muscle-building', 'strength', 'recovery'],
  },
  {
    id: 'low-calorie',
    name: 'Calorie-Controlled Plan',
    description: 'Lower calorie intake with focus on nutrient density for weight loss',
    targetGoal: 'lose',
    suitableFor: {
      activityLevels: ['sedentary', 'moderate'],
    },
    calorieRange: {
      min: 1400,
      max: 1900,
    },
    macroDistribution: {
      protein: 35,
      carbs: 35,
      fat: 30,
    },
    sampleDays: [
      {
        day: 'Monday',
        meals: [
          {
            name: 'Breakfast',
            description: 'Veggie egg white omelet with whole grain toast',
            calories: 350,
            protein: 25,
            carbs: 30,
            fat: 10,
          },
          {
            name: 'Lunch',
            description: 'Large garden salad with grilled chicken and light vinaigrette',
            calories: 400,
            protein: 30,
            carbs: 20,
            fat: 15,
          },
          {
            name: 'Dinner',
            description: 'Baked white fish with steamed vegetables and small portion of quinoa',
            calories: 450,
            protein: 35,
            carbs: 30,
            fat: 12,
          },
          {
            name: 'Snack',
            description: 'Greek yogurt with berries',
            calories: 150,
            protein: 15,
            carbs: 10,
            fat: 5,
          },
        ],
      },
    ],
    tags: ['weight-loss', 'calorie-deficit', 'portion-control'],
  },
  {
    id: 'carb-cycling',
    name: 'Carb Cycling Plan',
    description: 'Alternates between high and low carb days to maximize fat loss while maintaining performance',
    targetGoal: 'lose',
    suitableFor: {
      activityLevels: ['moderate', 'active'],
    },
    calorieRange: {
      min: 1600,
      max: 2200,
    },
    macroDistribution: {
      protein: 35,
      carbs: 30,
      fat: 35,
    },
    sampleDays: [
      {
        day: 'High Carb Day (Training)',
        meals: [
          {
            name: 'Breakfast',
            description: 'Oatmeal with banana, protein powder and almond milk',
            calories: 450,
            protein: 30,
            carbs: 60,
            fat: 8,
          },
          {
            name: 'Lunch',
            description: 'Brown rice bowl with lean protein and vegetables',
            calories: 550,
            protein: 35,
            carbs: 65,
            fat: 10,
          },
          {
            name: 'Dinner',
            description: 'Whole grain pasta with turkey meatballs and tomato sauce',
            calories: 600,
            protein: 40,
            carbs: 70,
            fat: 12,
          },
        ],
      },
      {
        day: 'Low Carb Day (Rest)',
        meals: [
          {
            name: 'Breakfast',
            description: 'Eggs with avocado and vegetables',
            calories: 400,
            protein: 25,
            carbs: 10,
            fat: 28,
          },
          {
            name: 'Lunch',
            description: 'Large salad with grilled chicken, olive oil and nuts',
            calories: 500,
            protein: 35,
            carbs: 15,
            fat: 30,
          },
          {
            name: 'Dinner',
            description: 'Grilled salmon with roasted vegetables',
            calories: 550,
            protein: 40,
            carbs: 15,
            fat: 32,
          },
        ],
      }
    ],
    tags: ['athletic', 'performance', 'fat-loss', 'advanced'],
  },
  {
    id: 'plant-based',
    name: 'Plant-Based Plan',
    description: 'Nutrient-rich vegetarian approach focusing on whole foods',
    targetGoal: 'maintain',
    suitableFor: {
      activityLevels: ['sedentary', 'moderate', 'active'],
    },
    calorieRange: {
      min: 1700,
      max: 2400,
    },
    macroDistribution: {
      protein: 25,
      carbs: 55,
      fat: 20,
    },
    sampleDays: [
      {
        day: 'Monday',
        meals: [
          {
            name: 'Breakfast',
            description: 'Smoothie bowl with plant protein, fruits, and chia seeds',
            calories: 450,
            protein: 20,
            carbs: 65,
            fat: 10,
          },
          {
            name: 'Lunch',
            description: 'Lentil soup with whole grain bread and hummus',
            calories: 500,
            protein: 22,
            carbs: 70,
            fat: 10,
          },
          {
            name: 'Dinner',
            description: 'Tofu stir-fry with brown rice and vegetables',
            calories: 550,
            protein: 25,
            carbs: 70,
            fat: 15,
          },
          {
            name: 'Snack',
            description: 'Mixed nuts and dried fruit',
            calories: 250,
            protein: 8,
            carbs: 20,
            fat: 16,
          },
        ],
      },
    ],
    tags: ['vegetarian', 'plant-based', 'sustainable'],
  },
];

/**
 * Calculate BMR (Basal Metabolic Rate) using the Mifflin-St Jeor Equation
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'male' or 'female'
 */
export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (!weight || !height || !age) {
    return 0;
  }

  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure) based on BMR and activity level
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - Activity level ('sedentary', 'moderate', 'active')
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  if (!bmr) return 0;

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2, // Little or no exercise
    moderate: 1.55, // Moderate exercise 3-5 days/week
    active: 1.725, // Active - hard exercise 6-7 days/week
  };

  const multiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate target calories based on TDEE and goal
 * @param tdee - Total Daily Energy Expenditure
 * @param goal - Weight goal ('lose', 'maintain', 'gain')
 */
export function calculateTargetCalories(tdee: number, goal: string): number {
  if (!tdee) return 0;

  switch (goal) {
    case 'lose':
      return Math.round(tdee - 500); // 500 calorie deficit for weight loss
    case 'gain':
      return Math.round(tdee + 500); // 500 calorie surplus for weight gain
    case 'maintain':
    default:
      return tdee;
  }
}

interface UserMetrics {
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  goal: string;
  targetCalories?: number;
}

/**
 * Get recommended meal programs based on user metrics
 * @param userMetrics - User health metrics and goals
 * @param limit - Maximum number of programs to return
 */
export function getRecommendedPrograms(userMetrics: UserMetrics, limit = 3): MealProgram[] {
  const { weight, height, age, gender, activityLevel, goal, targetCalories } = userMetrics;

  // Calculate target calories if not provided
  const calculatedTargetCalories = targetCalories || calculateTargetCalories(
    calculateTDEE(
      calculateBMR(weight, height, age, gender),
      activityLevel
    ),
    goal
  );

  // Filter programs by goal and activity level
  let matchingPrograms = mealPrograms.filter(program => {
    // Match by goal
    const goalMatch = program.targetGoal === goal;
    
    // Match by activity level
    const activityMatch = program.suitableFor.activityLevels.includes(activityLevel);
    
    // Match by calorie range (with some flexibility)
    const calorieMatch = calculatedTargetCalories >= (program.calorieRange.min - 200) && 
                         calculatedTargetCalories <= (program.calorieRange.max + 200);
    
    return goalMatch && activityMatch && calorieMatch;
  });

  // If no programs match all criteria, fall back to matching just by goal
  if (matchingPrograms.length === 0) {
    matchingPrograms = mealPrograms.filter(program => program.targetGoal === goal);
  }

  // If still no matches, return any programs that are close to the calorie target
  if (matchingPrograms.length === 0) {
    matchingPrograms = mealPrograms.filter(program => {
      return calculatedTargetCalories >= (program.calorieRange.min - 300) && 
             calculatedTargetCalories <= (program.calorieRange.max + 300);
    });
  }

  // If still no matches, return the first few programs as a fallback
  if (matchingPrograms.length === 0) {
    matchingPrograms = mealPrograms.slice(0, limit);
  }

  return matchingPrograms.slice(0, limit);
}
