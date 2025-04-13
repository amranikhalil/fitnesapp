import { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, IconButton, Divider, useTheme, Avatar, Button, ProgressBar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';

// Mock data for demonstration
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  date: string;
  calories: number;
  items: FoodItem[];
  image?: string;
}

const mockMeals: Record<string, Meal> = {
  '1': {
    id: '1',
    name: 'Breakfast',
    time: '8:30 AM',
    date: '2023-10-15',
    calories: 450,
    image: 'https://images.unsplash.com/photo-1533089860892-a9b9ac6cd6b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    items: [
      { id: '1', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, servingSize: '1 cup (240g)' },
      { id: '2', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, servingSize: '1 medium (118g)' },
      { id: '3', name: 'Almond Milk', calories: 30, protein: 1, carbs: 1, fat: 2.5, servingSize: '1 cup (240ml)' },
      { id: '4', name: 'Honey', calories: 65, protein: 0, carbs: 17, fat: 0, servingSize: '1 tbsp (21g)' },
      { id: '5', name: 'Chia Seeds', calories: 100, protein: 3, carbs: 8, fat: 6, servingSize: '1 tbsp (15g)' },
    ],
  },
  '2': {
    id: '2',
    name: 'Lunch',
    time: '12:45 PM',
    date: '2023-10-15',
    calories: 620,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1480&q=80',
    items: [
      { id: '1', name: 'Chicken Salad', calories: 350, protein: 30, carbs: 10, fat: 20, servingSize: '1 bowl (250g)' },
      { id: '2', name: 'Whole Grain Bread', calories: 180, protein: 8, carbs: 33, fat: 2, servingSize: '2 slices (60g)' },
      { id: '3', name: 'Apple', calories: 90, protein: 0, carbs: 25, fat: 0, servingSize: '1 medium (182g)' },
    ],
  },
};

export default function MealDetails() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showNutritionChart, setShowNutritionChart] = useState(true);

  // Get meal data based on ID
  const meal = id ? mockMeals[id] : null;

  if (!meal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => router.back()} 
            iconColor={theme.colors.primary}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>Meal Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge">Meal not found</Text>
          <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total nutrition
  const totalProtein = meal.items.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = meal.items.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = meal.items.reduce((sum, item) => sum + item.fat, 0);

  // Calculate percentages for visualization
  const totalMacros = totalProtein + totalCarbs + totalFat;
  const proteinPercentage = Math.round((totalProtein * 4 / meal.calories) * 100);
  const carbsPercentage = Math.round((totalCarbs * 4 / meal.calories) * 100);
  const fatPercentage = Math.round((totalFat * 9 / meal.calories) * 100);

  const handleEditMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to edit meal screen
    // router.push(`/dashboard/edit-meal?id=${meal.id}`);
  };

  const handleDeleteMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Show confirmation dialog and delete meal
    router.back();
  };

  const toggleNutritionView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNutritionChart(!showNutritionChart);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={() => router.back()} 
          iconColor={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>Meal Details</Text>
        <IconButton 
          icon="pencil" 
          size={24} 
          onPress={handleEditMeal} 
          iconColor={theme.colors.primary}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {meal.image && (
          <Image 
            source={{ uri: meal.image }} 
            style={styles.mealImage} 
            resizeMode="cover"
          />
        )}

        <Surface style={styles.mealInfoCard} elevation={0}>
          <View style={styles.mealHeaderRow}>
            <View>
              <Text variant="headlineMedium" style={[styles.mealName, { color: theme.colors.primary }]}>
                {meal.name}
              </Text>
              <Text variant="bodyMedium" style={styles.mealTime}>
                {meal.time} • {meal.date}
              </Text>
            </View>
            <Surface style={styles.calorieChip} elevation={1}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{meal.calories}</Text>
              <Text variant="bodySmall">calories</Text>
            </Surface>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.nutritionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Nutrition Summary</Text>
            <TouchableOpacity onPress={toggleNutritionView}>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                {showNutritionChart ? 'Show Details' : 'Show Chart'}
              </Text>
            </TouchableOpacity>
          </View>

          {showNutritionChart ? (
            <View style={styles.chartContainer}>
              {/* Custom Macro Visualization */}
              <View style={styles.macroVisualization}>
                <View 
                  style={[
                    styles.macroBar, 
                    { width: `${proteinPercentage}%`, backgroundColor: theme.colors.primary }
                  ]} 
                />
                <View 
                  style={[
                    styles.macroBar, 
                    { width: `${carbsPercentage}%`, backgroundColor: theme.colors.secondary }
                  ]} 
                />
                <View 
                  style={[
                    styles.macroBar, 
                    { width: `${fatPercentage}%`, backgroundColor: theme.colors.tertiary }
                  ]} 
                />
              </View>
              
              <View style={styles.macroLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
                  <Text variant="bodyMedium">Protein: {totalProtein}g ({proteinPercentage}%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: theme.colors.secondary }]} />
                  <Text variant="bodyMedium">Carbs: {totalCarbs}g ({carbsPercentage}%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: theme.colors.tertiary }]} />
                  <Text variant="bodyMedium">Fat: {totalFat}g ({fatPercentage}%)</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.macroDetails}>
              <View style={styles.macroDetailItem}>
                <Text variant="bodyLarge">Protein</Text>
                <View style={styles.macroProgressContainer}>
                  <ProgressBar 
                    progress={totalProtein / (totalMacros || 1)} 
                    color={theme.colors.primary}
                    style={styles.macroProgress}
                  />
                  <Text variant="bodyMedium">{totalProtein}g</Text>
                </View>
              </View>
              <View style={styles.macroDetailItem}>
                <Text variant="bodyLarge">Carbohydrates</Text>
                <View style={styles.macroProgressContainer}>
                  <ProgressBar 
                    progress={totalCarbs / (totalMacros || 1)} 
                    color={theme.colors.secondary}
                    style={styles.macroProgress}
                  />
                  <Text variant="bodyMedium">{totalCarbs}g</Text>
                </View>
              </View>
              <View style={styles.macroDetailItem}>
                <Text variant="bodyLarge">Fat</Text>
                <View style={styles.macroProgressContainer}>
                  <ProgressBar 
                    progress={totalFat / (totalMacros || 1)} 
                    color={theme.colors.tertiary}
                    style={styles.macroProgress}
                  />
                  <Text variant="bodyMedium">{totalFat}g</Text>
                </View>
              </View>
              <Text variant="bodySmall" style={styles.macroNote}>
                Daily recommended values: 50g protein, 275g carbs, 78g fat
              </Text>
            </View>
          )}
        </Surface>

        <Surface style={styles.foodItemsCard} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Food Items</Text>
          
          {meal.items.map((item, index) => (
            <View key={item.id}>
              <View style={styles.foodItem}>
                <View style={styles.foodItemInfo}>
                  <Text variant="bodyLarge">{item.name}</Text>
                  <Text variant="bodySmall" style={styles.servingSize}>{item.servingSize}</Text>
                </View>
                <View style={styles.foodItemNutrition}>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{item.calories} cal</Text>
                  <View style={styles.macroRow}>
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>P: {item.protein}g</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>C: {item.carbs}g</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.tertiary }}>F: {item.fat}g</Text>
                  </View>
                </View>
              </View>
              {index < meal.items.length - 1 && <Divider style={styles.itemDivider} />}
            </View>
          ))}
        </Surface>

        <Button 
          mode="outlined" 
          onPress={handleDeleteMeal}
          style={styles.deleteButton}
          textColor={theme.colors.error}
          icon="delete"
        >
          Delete Meal
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mealImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  mealInfoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealName: {
    fontWeight: 'bold',
  },
  mealTime: {
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  calorieChip: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  divider: {
    marginBottom: 16,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  chartContainer: {
    marginBottom: 16,
  },
  macroVisualization: {
    height: 24,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  macroBar: {
    height: '100%',
  },
  macroLegend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  macroDetails: {
    marginBottom: 8,
  },
  macroDetailItem: {
    marginBottom: 16,
  },
  macroProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  macroProgress: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  macroNote: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontStyle: 'italic',
    marginTop: 8,
  },
  foodItemsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  foodItemInfo: {
    flex: 1,
  },
  servingSize: {
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  foodItemNutrition: {
    alignItems: 'flex-end',
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  itemDivider: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  deleteButton: {
    borderColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 12,
  },
});
