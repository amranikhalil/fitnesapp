import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Text, Card, FAB, Surface, ProgressBar, IconButton, Divider, useTheme, Avatar, Button, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth';
import { useMeals, Meal, FoodItem } from '../../lib/meals';
import { usePrograms } from '../../lib/programs/programs-context';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isGuestMode, signOut } = useAuth();
  const { meals, dailyCalorieTarget, addMeal } = useMeals();
  const { selectedProgram, userMetrics } = usePrograms();
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams();

  // Daily targets
  const totalCaloriesConsumed = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const remainingCalories = dailyCalorieTarget - totalCaloriesConsumed;
  const calorieProgress = totalCaloriesConsumed / dailyCalorieTarget;

  // Macros calculations (simplified estimates)
  const totalProtein = meals.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + (item.protein || 0), 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + (item.carbs || 0), 0), 0);
  const totalFat = meals.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + (item.fat || 0), 0), 0);

  // Format date for display
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleViewMealProgram = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/dashboard/meal-program/');
  };

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

  // Handle logout
  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Toggle meal expansion
  const toggleMealExpansion = (mealId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedMealId(expandedMealId === mealId ? null : mealId);
  };

  const handleAddMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/dashboard/add-meal');
  };

  const renderMealItem = ({ item }: { item: Meal }) => {
    const isExpanded = expandedMealId === item.id;

    // Determine the meal icon based on the meal name
    let mealIcon = 'restaurant-outline';
    if (item.name.toLowerCase().includes('breakfast')) {
      mealIcon = 'cafe-outline';
    } else if (item.name.toLowerCase().includes('lunch')) {
      mealIcon = 'fast-food-outline';
    } else if (item.name.toLowerCase().includes('dinner')) {
      mealIcon = 'restaurant-outline';
    } else if (item.name.toLowerCase().includes('snack')) {
      mealIcon = 'nutrition-outline';
    }

    return (
      <Card style={styles.mealCard} elevation={2}>
        <TouchableOpacity onPress={() => toggleMealExpansion(item.id)}>
          <Card.Content>
            <View style={styles.mealHeader}>
              <View style={styles.mealTitleContainer}>
                <View style={styles.mealIconContainer}>
                  <Ionicons name={mealIcon as any} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.mealInfo}>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{item.name}</Text>
                  <Text variant="bodySmall" style={styles.timeText}>{item.time}</Text>
                </View>
              </View>
              <View style={styles.mealCalories}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.calories}</Text>
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
                  <View style={styles.foodItemHeader}>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>{foodItem.name}</Text>
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{foodItem.calories} cal</Text>
                  </View>
                  <View style={styles.macroRow}>
                    <Chip 
                      icon="food-drumstick" 
                      style={[styles.macroChip, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]} 
                      textStyle={{ fontSize: 12 }}
                    >
                      P: {foodItem.protein}g
                    </Chip>
                    <Chip 
                      icon="bread-slice" 
                      style={[styles.macroChip, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]} 
                      textStyle={{ fontSize: 12 }}
                    >
                      C: {foodItem.carbs}g
                    </Chip>
                    <Chip 
                      icon="oil" 
                      style={[styles.macroChip, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]} 
                      textStyle={{ fontSize: 12 }}
                    >
                      F: {foodItem.fat}g
                    </Chip>
                  </View>
                </View>
              ))}
              <Button 
                mode="outlined" 
                onPress={() => router.push(`/dashboard/meal-details?id=${item.id}`)}
                style={styles.viewDetailsButton}
                icon="arrow-right"
                contentStyle={{ flexDirection: 'row-reverse' }}
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
      <LinearGradient
        colors={['rgba(0, 120, 255, 0.1)', 'rgba(0, 120, 255, 0.05)', 'rgba(255, 255, 255, 0)']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.headerTitle}>My Daily Calories</Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>{formattedDate}</Text>
          </View>
          <View style={styles.headerActions}>
            {isGuestMode && (
              <Chip icon="account" style={styles.guestChip} compact>Guest</Chip>
            )}
            <IconButton 
              icon="logout" 
              size={24} 
              onPress={handleLogout}
              iconColor={theme.colors.primary}
              style={styles.logoutButton}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Today's Summary */}
        <Surface style={styles.summaryCard} elevation={4}>
          <View style={styles.calorieContainer}>
            <View style={styles.calorieInfo}>
              <Text variant="displaySmall" style={styles.calorieCount}>
                {totalCaloriesConsumed}
              </Text>
              <Text variant="bodyMedium" style={styles.calorieLabel}>CONSUMED</Text>
            </View>
            
            <View style={styles.dividerContainer}>
              <View style={styles.verticalDivider} />
            </View>
            
            <View style={styles.calorieInfo}>
              <Text variant="displaySmall" style={[styles.calorieCount, remainingCalories < 0 ? { color: theme.colors.error } : { color: theme.colors.secondary }]}>
                {remainingCalories}
              </Text>
              <Text variant="bodyMedium" style={styles.calorieLabel}>REMAINING</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelContainer}>
              <Text variant="bodySmall" style={styles.progressLabel}>
                {Math.round(calorieProgress * 100)}% of Daily Goal
              </Text>
              <Text variant="bodySmall" style={styles.targetText}>
                Target: {dailyCalorieTarget} cal
              </Text>
            </View>
            <ProgressBar 
              progress={calorieProgress > 1 ? 1 : calorieProgress} 
              color={calorieProgress > 1 ? theme.colors.error : theme.colors.primary}
              style={styles.progressBar} 
            />
          </View>
          
          {/* Macros summary */}
          <View style={styles.macrosContainer}>
            <View style={styles.macroItemContainer}>
              <Text variant="titleLarge" style={[styles.macroValue, { color: '#4CAF50' }]}>{Math.round(totalProtein)}g</Text>
              <Text variant="bodySmall" style={styles.macroName}>Protein</Text>
            </View>
            <View style={styles.macroItemContainer}>
              <Text variant="titleLarge" style={[styles.macroValue, { color: '#2196F3' }]}>{Math.round(totalCarbs)}g</Text>
              <Text variant="bodySmall" style={styles.macroName}>Carbs</Text>
            </View>
            <View style={styles.macroItemContainer}>
              <Text variant="titleLarge" style={[styles.macroValue, { color: '#FF9800' }]}>{Math.round(totalFat)}g</Text>
              <Text variant="bodySmall" style={styles.macroName}>Fat</Text>
            </View>
          </View>
        </Surface>

        {/* Today's Meals Section */}
        <View style={styles.mealsContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Today's Meals</Text>
          
          {meals.length === 0 ? (
            <Surface style={styles.emptyMealsCard} elevation={1}>
              <Ionicons name="restaurant-outline" size={36} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.emptyMealsText}>No meals recorded today</Text>
              <Button 
                mode="contained" 
                onPress={handleAddMeal}
                style={styles.addFirstMealButton}
                icon="plus"
              >
                Add Your First Meal
              </Button>
            </Surface>
          ) : (
            <FlatList
              data={meals}
              renderItem={renderMealItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListFooterComponent={<View style={{ height: 80 }} />}
            />
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddMeal}
        color="white"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    backgroundColor: 'white',
  },
  dateContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    opacity: 0.7,
  },
  guestChip: {
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  calorieContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  calorieInfo: {
    flex: 1,
    alignItems: 'center',
  },
  calorieCount: {
    fontWeight: 'bold',
  },
  calorieLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
    fontWeight: '500',
  },
  dividerContainer: {
    height: 60,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  targetText: {
    opacity: 0.7,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  macroItemContainer: {
    alignItems: 'center',
  },
  macroValue: {
    fontWeight: 'bold',
  },
  macroName: {
    opacity: 0.7,
    marginTop: 2,
  },
  mealsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  mealCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 120, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  timeText: {
    opacity: 0.6,
    marginTop: 2,
  },
  mealCalories: {
    alignItems: 'flex-end',
  },
  expandedContent: {
    paddingTop: 16,
  },
  itemsTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  foodItem: {
    marginBottom: 12,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  macroChip: {
    marginRight: 8,
    height: 28,
  },
  macroText: {
    marginRight: 8,
  },
  viewDetailsButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  emptyMealsCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  emptyMealsText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  addFirstMealButton: {
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
  },
});
