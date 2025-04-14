import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, Surface, Chip, ActivityIndicator, useTheme, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { usePrograms } from '../../../lib/programs/programs-context';
import { MealProgram, MealProgramDay } from '../../../lib/programs/meal-programs';

export default function MealProgramScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const { userMetrics, selectedProgram, getRecommendedProgramsForUser, selectProgram } = usePrograms();
  
  const [recommendedPrograms, setRecommendedPrograms] = useState<MealProgram[]>([]);
  const [selectedProgramIndex, setSelectedProgramIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get recommended programs based on user metrics
    const programs = getRecommendedProgramsForUser();
    console.log('Recommended programs:', programs);
    
    // If no programs are returned, provide default ones
    if (!programs || programs.length === 0) {
      // Import all available programs as a fallback
      const { mealPrograms } = require('../../../lib/programs/meal-programs');
      console.log('Using fallback programs, total:', mealPrograms.length);
      setRecommendedPrograms(mealPrograms);
    } else {
      setRecommendedPrograms(programs);
    }

    // Find the index of the currently selected program if any
    if (selectedProgram) {
      const index = programs.findIndex(p => p.id === selectedProgram.id);
      if (index !== -1) {
        setSelectedProgramIndex(index);
      }
    }
  }, []);

  const handleSelectProgram = async (programId: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProgramIndex(index);
  };

  const handleSaveSelection = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    try {
      if (recommendedPrograms.length > 0) {
        const selectedProgram = recommendedPrograms[selectedProgramIndex];
        await selectProgram(selectedProgram.id);
        
        // Show success message
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error saving selected program:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render meal cards for the sample day
  function renderMealCards(sampleDay: MealProgramDay) {
    return (
      <View style={styles.mealCardsContainer}>
        {sampleDay.meals.map((meal, index) => (
          <Surface key={index} style={styles.mealCard} elevation={1}>
            <View style={styles.mealCardHeader}>
              <Avatar.Icon 
                size={32} 
                icon={getMealIcon(meal.name)} 
                style={{ backgroundColor: 'transparent' }}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                {meal.name}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.mealDescription}>
              {meal.description}
            </Text>
            <View style={styles.mealMacros}>
              <Chip 
                icon="fire" 
                style={[styles.macroChip, { backgroundColor: theme.colors.primaryContainer }]}
                compact
              >
                {meal.calories} cal
              </Chip>
              <Chip 
                icon="food-drumstick" 
                style={[styles.macroChip, { backgroundColor: theme.colors.secondaryContainer }]}
                compact
              >
                P: {meal.protein}g
              </Chip>
              <Chip 
                icon="bread-slice" 
                style={[styles.macroChip, { backgroundColor: theme.colors.secondaryContainer }]}
                compact
              >
                C: {meal.carbs}g
              </Chip>
              <Chip 
                icon="oil" 
                style={[styles.macroChip, { backgroundColor: theme.colors.tertiaryContainer }]}
                compact
              >
                F: {meal.fat}g
              </Chip>
            </View>
          </Surface>
        ))}
      </View>
    );
  }

  // Get appropriate icon for meal types
  function getMealIcon(mealName: string): string {
    const name = mealName.toLowerCase();
    if (name.includes('breakfast')) return 'food-croissant';
    if (name.includes('lunch')) return 'food';
    if (name.includes('dinner')) return 'food-turkey';
    if (name.includes('snack')) return 'food-apple';
    return 'silverware-fork-knife';
  }

  // Function to calculate and display macro distribution
  function renderMacroDistribution(program: MealProgram) {
    return (
      <View style={styles.macroDistribution}>
        <Text variant="bodySmall" style={styles.macroDistributionTitle}>
          Recommended Macro Distribution
        </Text>
        <View style={styles.macroPercentages}>
          <View style={styles.macroPercentageBar}>
            <View 
              style={[
                styles.macroPercentageFill, 
                { 
                  width: `${program.macroDistribution.protein}%`,
                  backgroundColor: theme.colors.primary 
                }
              ]} 
            />
            <Text style={styles.macroPercentageText}>
              {program.macroDistribution.protein}% Protein
            </Text>
          </View>
          <View style={styles.macroPercentageBar}>
            <View 
              style={[
                styles.macroPercentageFill, 
                { 
                  width: `${program.macroDistribution.carbs}%`,
                  backgroundColor: theme.colors.secondary 
                }
              ]} 
            />
            <Text style={styles.macroPercentageText}>
              {program.macroDistribution.carbs}% Carbs
            </Text>
          </View>
          <View style={styles.macroPercentageBar}>
            <View 
              style={[
                styles.macroPercentageFill, 
                { 
                  width: `${program.macroDistribution.fat}%`,
                  backgroundColor: theme.colors.tertiary 
                }
              ]} 
            />
            <Text style={styles.macroPercentageText}>
              {program.macroDistribution.fat}% Fat
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Render a program card
  const renderProgramCard = (program: MealProgram, index: number) => {
    const isSelected = index === selectedProgramIndex;
    
    return (
      <TouchableOpacity 
        key={program.id}
        style={[
          styles.programCard,
          isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
        ]}
        onPress={() => handleSelectProgram(program.id, index)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[theme.colors.surface, isSelected ? theme.colors.primaryContainer : theme.colors.surfaceVariant]}
          style={styles.programCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.programCardHeader}>
            <Text variant="headlineSmall" style={styles.programName}>
              {program.name}
            </Text>
            {isSelected && (
              <Avatar.Icon 
                size={24} 
                icon="check-circle" 
                color={theme.colors.primary}
                style={{ backgroundColor: 'transparent' }}
              />
            )}
          </View>
          
          <Text variant="bodyMedium" style={styles.programDescription}>
            {program.description}
          </Text>
          
          <View style={styles.programTags}>
            {program.tags.map((tag, idx) => (
              <Chip 
                key={idx}
                style={styles.tagChip}
                compact
              >
                {tag}
              </Chip>
            ))}
          </View>

          <View style={styles.calorieRangeContainer}>
            <Text variant="bodyMedium" style={styles.calorieRangeLabel}>
              Daily Calorie Range:
            </Text>
            <Text variant="bodyMedium" style={styles.calorieRangeValue}>
              {program.calorieRange.min} - {program.calorieRange.max} calories
            </Text>
          </View>

          {renderMacroDistribution(program)}

          {program.sampleDays.length > 0 && (
            <View style={styles.sampleDayContainer}>
              <Text variant="titleMedium" style={styles.sampleDayTitle}>
                Sample Day: {program.sampleDays[0].day}
              </Text>
              {renderMealCards(program.sampleDays[0])}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Ensure we're actually checking if programs exist
  if (!recommendedPrograms || recommendedPrograms.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>Meal Programs</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading meal programs...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Meal Programs</Text>
      </View>

      <View style={styles.subheader}>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Select a meal program that matches your goals
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {recommendedPrograms.map((program, index) => renderProgramCard(program, index))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSaveSelection}
          style={styles.saveButton}
          loading={isLoading}
          disabled={isLoading}
        >
          Save Selection
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  subheader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  subtitle: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  programCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  programCardGradient: {
    padding: 16,
  },
  programCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  programName: {
    fontWeight: 'bold',
    flex: 1,
  },
  programDescription: {
    marginBottom: 12,
    opacity: 0.8,
  },
  programTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  calorieRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  calorieRangeLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  calorieRangeValue: {
    opacity: 0.8,
  },
  macroDistribution: {
    marginTop: 8,
    marginBottom: 16,
  },
  macroDistributionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  macroPercentages: {
    gap: 8,
  },
  macroPercentageBar: {
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  macroPercentageFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 10,
  },
  macroPercentageText: {
    position: 'absolute',
    top: 0,
    left: 10,
    bottom: 0,
    fontSize: 12,
    textAlignVertical: 'center',
    color: '#000',
  },
  sampleDayContainer: {
    marginTop: 16,
  },
  sampleDayTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mealCardsContainer: {
    gap: 12,
  },
  mealCard: {
    padding: 12,
    borderRadius: 8,
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mealDescription: {
    marginBottom: 8,
    opacity: 0.8,
  },
  mealMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  macroChip: {
    height: 24,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    marginBottom: 8,
  },
});
