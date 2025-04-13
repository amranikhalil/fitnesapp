import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Text, Card, FAB, Surface, ProgressBar, IconButton, Divider, useTheme, Avatar, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth';
import { useMeals, Meal, FoodItem } from '../../lib/meals';

// Remove the mock data since we're using the context
// interface Meal {
//   id: string;
//   name: string;
//   time: string;
//   calories: number;
//   items: FoodItem[];
// }

// interface FoodItem {
//   id: string;
//   name: string;
//   calories: number;
//   protein: number;
//   carbs: number;
//   fat: number;
// }

// const mockMeals: Meal[] = [
//   {
//     id: '1',
//     name: 'Breakfast',
//     time: '8:30 AM',
//     calories: 450,
//     items: [
//       { id: '1', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 },
//       { id: '2', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
//       { id: '3', name: 'Almond Milk', calories: 30, protein: 1, carbs: 1, fat: 2.5 },
//       { id: '4', name: 'Honey', calories: 65, protein: 0, carbs: 17, fat: 0 },
//     ],
//   },
//   {
//     id: '2',
//     name: 'Lunch',
//     time: '12:45 PM',
//     calories: 620,
//     items: [
//       { id: '1', name: 'Chicken Salad', calories: 350, protein: 30, carbs: 10, fat: 20 },
//       { id: '2', name: 'Whole Grain Bread', calories: 180, protein: 8, carbs: 33, fat: 2 },
//       { id: '3', name: 'Apple', calories: 90, protein: 0, carbs: 25, fat: 0 },
//     ],
//   },
// ];

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { meals, addMeal } = useMeals();
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams();

  // Daily targets
  const dailyCalorieTarget = 2000;
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const remainingCalories = dailyCalorieTarget - totalCalories;
  const calorieProgress = totalCalories / dailyCalorieTarget;

  // Calculate macros
  const totalProtein = meals.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + item.protein, 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + item.carbs, 0), 0);
  const totalFat = meals.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + item.fat, 0), 0);

  // Handle new meal from add-meal screen
  useEffect(() => {
    if (params.newMeal) {
      try {
        const newMealData = JSON.parse(params.newMeal as string) as Meal;
        // Check if meal with this ID already exists to avoid duplicates
        if (!meals.some(meal => meal.id === newMealData.id)) {
          // Add the new meal using the context
          addMeal(newMealData);
          
          // Show the newly added meal as expanded
          setExpandedMealId(newMealData.id);
          
          // Provide haptic feedback for successful addition
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.error('Error parsing new meal data:', error);
      }
    }
  }, [params.newMeal]);

  const toggleMealExpansion = (mealId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedMealId(expandedMealId === mealId ? null : mealId);
  };

  const handleAddMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/dashboard/add-meal');
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // In a real app, we would fetch new data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const renderMealItem = ({ item }: { item: Meal }) => {
    const isExpanded = expandedMealId === item.id;

    return (
      <Card style={styles.mealCard} mode="outlined">
        <TouchableOpacity onPress={() => toggleMealExpansion(item.id)}>
          <Card.Content>
            <View style={styles.mealHeader}>
              <View style={styles.mealInfo}>
                <Text variant="titleMedium" style={{ color: theme.colors.primary }}>{item.name}</Text>
                <Text variant="bodySmall" style={styles.timeText}>{item.time}</Text>
              </View>
              <View style={styles.calorieContainer}>
                <Text variant="titleMedium">{item.calories}</Text>
                <Text variant="bodySmall">calories</Text>
              </View>
            </View>
          </Card.Content>
        </TouchableOpacity>

        {isExpanded && (
          <>
            <Divider />
            <Card.Content style={styles.expandedContent}>
              <Text variant="titleSmall" style={styles.itemsTitle}>Food Items</Text>
              {item.items.map((foodItem) => (
                <View key={foodItem.id} style={styles.foodItem}>
                  <Text variant="bodyMedium">{foodItem.name}</Text>
                  <View style={styles.macroRow}>
                    <Text variant="bodySmall">{foodItem.calories} cal</Text>
                    <Text variant="bodySmall" style={[styles.macroText, { color: theme.colors.primary }]}>P: {foodItem.protein}g</Text>
                    <Text variant="bodySmall" style={[styles.macroText, { color: theme.colors.secondary }]}>C: {foodItem.carbs}g</Text>
                    <Text variant="bodySmall" style={[styles.macroText, { color: theme.colors.tertiary }]}>F: {foodItem.fat}g</Text>
                  </View>
                </View>
              ))}
              <Button 
                mode="text" 
                onPress={() => router.push(`/dashboard/meal-details?id=${item.id}`)}
                style={styles.viewDetailsButton}
                textColor={theme.colors.primary}
              >
                View Details
              </Button>
            </Card.Content>
          </>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>Today's Summary</Text>
        <IconButton 
          icon="logout" 
          size={24} 
          onPress={handleLogout}
          iconColor={theme.colors.primary}
        />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <LinearGradient
          colors={[theme.colors.primaryContainer, theme.colors.surfaceVariant]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.calorieRow}>
            <View style={styles.calorieItem}>
              <Text variant="titleLarge">{totalCalories}</Text>
              <Text variant="bodySmall">consumed</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.calorieItem}>
              <Text variant="titleLarge">{remainingCalories}</Text>
              <Text variant="bodySmall">remaining</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.calorieItem}>
              <Text variant="titleLarge">{dailyCalorieTarget}</Text>
              <Text variant="bodySmall">target</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={calorieProgress} 
              style={styles.progressBar} 
              color={theme.colors.primary} 
            />
            <Text variant="bodySmall" style={styles.progressText}>
              {Math.round(calorieProgress * 100)}% of daily goal
            </Text>
          </View>
        </LinearGradient>

        <Surface style={styles.macroCard} elevation={0}>
          <Text variant="titleMedium" style={styles.macroTitle}>Macronutrients</Text>
          <View style={styles.macroContainer}>
            <View style={styles.macroItem}>
              <Avatar.Icon 
                size={40} 
                icon="food-drumstick" 
                style={[styles.macroIcon, { backgroundColor: theme.colors.primaryContainer }]}
                color={theme.colors.primary}
              />
              <Text variant="bodyMedium" style={styles.macroValue}>{totalProtein}g</Text>
              <Text variant="bodySmall">Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Avatar.Icon 
                size={40} 
                icon="bread-slice" 
                style={[styles.macroIcon, { backgroundColor: theme.colors.secondaryContainer }]}
                color={theme.colors.secondary}
              />
              <Text variant="bodyMedium" style={styles.macroValue}>{totalCarbs}g</Text>
              <Text variant="bodySmall">Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Avatar.Icon 
                size={40} 
                icon="oil" 
                style={[styles.macroIcon, { backgroundColor: '#F0E6FF' }]}
                color={theme.colors.tertiary}
              />
              <Text variant="bodyMedium" style={styles.macroValue}>{totalFat}g</Text>
              <Text variant="bodySmall">Fat</Text>
            </View>
          </View>
        </Surface>

        <Text variant="titleMedium" style={styles.sectionTitle}>Today's Meals</Text>

        <FlatList
          data={meals}
          renderItem={renderMealItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.mealsList}
        />
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Meal"
        style={[styles.fab, { bottom: insets.bottom + 16, backgroundColor: theme.colors.primary }]}
        onPress={handleAddMeal}
        color={theme.colors.onPrimary}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieItem: {
    alignItems: 'center',
  },
  dividerVertical: {
    height: 40,
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  macroCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  macroTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroIcon: {
    marginBottom: 8,
  },
  macroValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  timeText: {
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  calorieContainer: {
    alignItems: 'center',
  },
  expandedContent: {
    paddingTop: 16,
  },
  itemsTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  foodItem: {
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  macroText: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
  viewDetailsButton: {
    marginTop: 16,
  },
});
