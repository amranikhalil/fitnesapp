import { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, IconButton, Divider, useTheme, Avatar, Button, ProgressBar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';
import { useMeals, FoodItem, Meal } from '../../lib/meals';

export default function MealDetails() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showNutritionChart, setShowNutritionChart] = useState(true);
  const { meals, deleteMeal } = useMeals();

  // Improved meal lookup to ensure consistent ID comparison
  // Convert both IDs to strings for consistent comparison
  const meal = id ? meals.find(m => String(m.id) === String(id)) : null;
  
  console.log('Meal ID from params:', id);
  console.log('Available meal IDs:', meals.map(m => m.id));

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
  const proteinPercentage = Math.round((totalProtein * 4 / meal.calories) * 100) || 0;
  const carbsPercentage = Math.round((totalCarbs * 4 / meal.calories) * 100) || 0;
  const fatPercentage = Math.round((totalFat * 9 / meal.calories) * 100) || 0;

  const handleEditMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to edit meal screen
    // router.push(`/dashboard/edit-meal?id=${meal.id}`);
  };

  const handleDeleteMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Delete the meal using context function
    deleteMeal(meal.id);
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
                {meal.time}
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
                  <Text variant="bodyMedium">{totalProtein}g Protein ({proteinPercentage}%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: theme.colors.secondary }]} />
                  <Text variant="bodyMedium">{totalCarbs}g Carbs ({carbsPercentage}%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: theme.colors.tertiary }]} />
                  <Text variant="bodyMedium">{totalFat}g Fat ({fatPercentage}%)</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.nutritionDetails}>
              <View style={styles.nutrientRow}>
                <Text variant="bodyMedium">Protein</Text>
                <Text variant="bodyMedium">{totalProtein}g</Text>
              </View>
              <ProgressBar 
                progress={totalProtein * 4 / meal.calories} 
                color={theme.colors.primary} 
                style={styles.progressBar} 
              />
              
              <View style={styles.nutrientRow}>
                <Text variant="bodyMedium">Carbs</Text>
                <Text variant="bodyMedium">{totalCarbs}g</Text>
              </View>
              <ProgressBar 
                progress={totalCarbs * 4 / meal.calories} 
                color={theme.colors.secondary} 
                style={styles.progressBar} 
              />
              
              <View style={styles.nutrientRow}>
                <Text variant="bodyMedium">Fat</Text>
                <Text variant="bodyMedium">{totalFat}g</Text>
              </View>
              <ProgressBar 
                progress={totalFat * 9 / meal.calories} 
                color={theme.colors.tertiary} 
                style={styles.progressBar} 
              />
            </View>
          )}

          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.sectionTitle}>Food Items</Text>
          
          {meal.items.map((item, index) => (
            <Surface key={item.id} style={styles.foodItemCard} elevation={0}>
              <View style={styles.foodItemHeader}>
                <View style={styles.foodItemLeft}>
                  <Avatar.Icon 
                    size={40} 
                    icon="food" 
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.primary}
                  />
                  <View style={styles.foodItemInfo}>
                    <Text variant="titleMedium">{item.name}</Text>
                    {item.servingSize && (
                      <Text variant="bodySmall" style={styles.servingText}>{item.servingSize}</Text>
                    )}
                  </View>
                </View>
                <Text variant="titleMedium">{item.calories} cal</Text>
              </View>
              
              <View style={styles.macroRow}>
                <Text variant="bodySmall" style={styles.macroText}>P: {item.protein}g</Text>
                <Text variant="bodySmall" style={styles.macroText}>C: {item.carbs}g</Text>
                <Text variant="bodySmall" style={styles.macroText}>F: {item.fat}g</Text>
              </View>
            </Surface>
          ))}
        </Surface>

        <Button 
          mode="outlined" 
          icon="delete" 
          onPress={handleDeleteMeal}
          style={styles.deleteButton}
          textColor={theme.colors.error}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  mealImage: {
    width: '100%',
    height: 200,
  },
  mealInfoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontWeight: 'bold',
  },
  mealTime: {
    color: '#666',
  },
  calorieChip: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartContainer: {
    marginBottom: 16,
  },
  macroVisualization: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  macroBar: {
    height: '100%',
  },
  macroLegend: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  nutritionDetails: {
    marginBottom: 16,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  foodItemCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F5F7FA',
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodItemInfo: {
    marginLeft: 12,
  },
  servingText: {
    color: '#666',
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingLeft: 52,
  },
  macroText: {
    marginRight: 16,
    color: '#666',
  },
  deleteButton: {
    margin: 16,
    borderColor: '#ffcccc',
  },
});
