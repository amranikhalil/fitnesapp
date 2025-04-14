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

  // Format date for display
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleViewMealProgram = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Use tab navigation instead of pushing to a specific screen
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

    return (
      <Card style={styles.mealCard} mode="outlined">
        <TouchableOpacity onPress={() => toggleMealExpansion(item.id)}>
          <Card.Content>
            <View style={styles.mealHeader}>
              <View style={styles.mealInfo}>
                <Text variant="titleMedium" style={{ color: theme.colors.primary }}>{item.name}</Text>
                <Text variant="bodySmall" style={styles.timeText}>{item.time}</Text>
              </View>
              <View style={styles.mealCalories}>
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
        {/* Today's Summary */}
        <Surface style={styles.summaryCard} elevation={0}>
          <View style={styles.dateContainer}>
            <Text variant="titleMedium" style={styles.dateText}>{formattedDate}</Text>
            {isGuestMode && (
              <Chip icon="account" style={styles.guestChip}>Guest Mode</Chip>
            )}
          </View>
          
          <View style={styles.calorieContainer}>
            <View style={styles.calorieInfo}>
              <Text variant="displaySmall" style={styles.calorieCount}>
                {totalCaloriesConsumed}
              </Text>
              <Text variant="bodyMedium" style={styles.calorieLabel}>calories consumed</Text>
            </View>
            
            <View style={styles.calorieInfo}>
              <Text variant="displaySmall" style={[styles.calorieCount, { color: theme.colors.secondary }]}>
                {remainingCalories}
              </Text>
              <Text variant="bodyMedium" style={styles.calorieLabel}>calories remaining</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={calorieProgress > 1 ? 1 : calorieProgress} 
              color={calorieProgress > 1 ? theme.colors.error : theme.colors.primary}
              style={styles.progressBar} 
            />
            <Text variant="bodySmall" style={styles.targetText}>
              Daily Target: {dailyCalorieTarget} calories
            </Text>
          </View>
        </Surface>

        {/* Current Meal Program */}
        <Surface style={styles.programCard} elevation={0}>
          <View style={styles.programHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Your Meal Program</Text>
            <Button 
              mode="text" 
              onPress={handleViewMealProgram}
              icon="pencil"
              compact
            >
              Change
            </Button>
          </View>
          
          {selectedProgram ? (
            <View style={styles.programInfo}>
              <View style={styles.programNameRow}>
                <Avatar.Icon 
                  size={40} 
                  icon="food-fork-drink" 
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                  color={theme.colors.primary}
                />
                <View style={styles.programTextContainer}>
                  <Text variant="titleMedium" style={styles.programName}>{selectedProgram.name}</Text>
                  <Text variant="bodySmall" style={styles.programDescription}>{selectedProgram.description}</Text>
                </View>
              </View>
              
              <View style={styles.programStats}>
                <Chip icon="fire" style={styles.programStat}>
                  {selectedProgram.calorieRange.min}-{selectedProgram.calorieRange.max} cal
                </Chip>
                <Chip icon="food-drumstick" style={styles.programStat}>
                  {selectedProgram.macroDistribution.protein}% protein
                </Chip>
                <Chip icon="bread-slice" style={styles.programStat}>
                  {selectedProgram.macroDistribution.carbs}% carbs
                </Chip>
                <Chip icon="oil" style={styles.programStat}>
                  {selectedProgram.macroDistribution.fat}% fat
                </Chip>
              </View>
            </View>
          ) : (
            <View style={styles.noProgramContainer}>
              <Text variant="bodyMedium" style={styles.noProgramText}>
                You haven't selected a meal program yet
              </Text>
              <Button 
                mode="contained" 
                onPress={handleViewMealProgram}
                style={{ marginTop: 8 }}
              >
                Choose a Program
              </Button>
            </View>
          )}
        </Surface>

        {/* Today's Meals */}
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestChip: {
    marginLeft: 8,
  },
  calorieContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieInfo: {
    alignItems: 'center',
  },
  calorieCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  calorieLabel: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  targetText: {
    textAlign: 'center',
    marginTop: 8,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  programCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  programInfo: {
    marginBottom: 16,
  },
  programNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  programTextContainer: {
    marginLeft: 16,
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  programDescription: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  programStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  programStat: {
    marginRight: 8,
  },
  noProgramContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  noProgramText: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    marginBottom: 16,
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
  mealCalories: {
    alignItems: 'flex-end',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
