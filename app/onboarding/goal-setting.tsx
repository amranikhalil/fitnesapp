import { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Surface, TextInput, SegmentedButtons } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePrograms } from '../../lib/programs/programs-context';
import { calculateBMR, calculateTDEE, calculateTargetCalories } from '../../lib/programs/meal-programs';

interface GoalType {
  id: string;
  label: string;
  description: string;
  defaultCalories: number;
}

const goalTypes: GoalType[] = [
  {
    id: 'lose',
    label: 'Lose Weight',
    description: 'Reduce calorie intake to create a deficit',
    defaultCalories: 1800,
  },
  {
    id: 'maintain',
    label: 'Maintain Weight',
    description: 'Balance calorie intake with expenditure',
    defaultCalories: 2000,
  },
  {
    id: 'gain',
    label: 'Gain Weight',
    description: 'Increase calorie intake to build muscle',
    defaultCalories: 2500,
  },
];

export default function GoalSetting() {
  const router = useRouter();
  const { setUserMetrics, selectProgram } = usePrograms();
  const [selectedGoal, setSelectedGoal] = useState('maintain');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);

  // Get the selected goal type object
  const currentGoal = goalTypes.find(goal => goal.id === selectedGoal) || goalTypes[1];

  // Update calorie target when goal type changes
  const handleGoalChange = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(value);
    const newGoal = goalTypes.find(goal => goal.id === value);
    if (newGoal) {
      setCalorieTarget(newGoal.defaultCalories);
    }
  };

  const handleCalorieChange = (value: number) => {
    setCalorieTarget(value);
  };

  const handleSaveGoals = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // Parse input values
      const weightValue = parseFloat(weight);
      const heightValue = parseFloat(height);
      const ageValue = parseInt(age);
      
      // Calculate target calories based on metrics if user hasn't adjusted the slider
      let calculatedCalorieTarget = calorieTarget;
      
      if (weightValue && heightValue && ageValue && gender) {
        const bmr = calculateBMR(weightValue, heightValue, ageValue, gender);
        const tdee = calculateTDEE(bmr, activityLevel);
        calculatedCalorieTarget = calculateTargetCalories(tdee, selectedGoal);
      }
      
      // Ensure we have valid metrics by using defaults where necessary
      const userMetrics = {
        weight: weightValue || 70, // Default if not provided
        height: heightValue || 170,
        age: ageValue || 30,
        gender: gender || 'male',
        activityLevel: activityLevel || 'moderate',
        goal: selectedGoal || 'maintain',
        targetCalories: calculatedCalorieTarget || 2000,
      };
      
      console.log('Saving user metrics:', userMetrics);
      
      // Save user metrics to Programs context
      await setUserMetrics(userMetrics);
      
      // Pre-select a default program
      const { mealPrograms } = require('../../lib/programs/meal-programs');
      if (mealPrograms && mealPrograms.length > 0) {
        // Find a program that matches the user's goal
        const matchingProgram = mealPrograms.find(p => p.targetGoal === selectedGoal);
        if (matchingProgram) {
          console.log('Pre-selecting program:', matchingProgram.name);
          // Select this program
          await selectProgram(matchingProgram.id);
        }
      }
      
      // Navigate to the program recommendations screen
      router.push('/onboarding/program-recommendations');
    } catch (error) {
      console.error('Error saving goals:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineMedium" style={styles.title}>
            Set Your Health Goals
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Help us personalize your experience
          </Text>

          <Surface style={styles.formContainer} elevation={0}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Personal Information
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                label="Current Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                mode="outlined"
                keyboardType="numeric"
                style={styles.inputHalf}
              />
              
              <TextInput
                label="Target Weight (kg)"
                value={targetWeight}
                onChangeText={setTargetWeight}
                mode="outlined"
                keyboardType="numeric"
                style={styles.inputHalf}
              />
            </View>

            <View style={styles.inputRow}>
              <TextInput
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                mode="outlined"
                keyboardType="numeric"
                style={styles.inputHalf}
              />
              
              <TextInput
                label="Age"
                value={age}
                onChangeText={setAge}
                mode="outlined"
                keyboardType="numeric"
                style={styles.inputHalf}
              />
            </View>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Gender
            </Text>
            <SegmentedButtons
              value={gender}
              onValueChange={setGender}
              buttons={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Activity Level
            </Text>
            <SegmentedButtons
              value={activityLevel}
              onValueChange={setActivityLevel}
              buttons={[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'active', label: 'Active' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Goal
            </Text>
            <SegmentedButtons
              value={selectedGoal}
              onValueChange={handleGoalChange}
              buttons={goalTypes.map(goal => ({ value: goal.id, label: goal.label }))}
              style={styles.segmentedButtons}
            />
            
            <Text variant="bodyMedium" style={styles.goalDescription}>
              {currentGoal.description}
            </Text>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Daily Calorie Target: {calorieTarget}
            </Text>
            <View style={styles.sliderContainer}>
              <Slider
                value={calorieTarget}
                onValueChange={handleCalorieChange}
                minimumValue={1200}
                maximumValue={3500}
                step={50}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#4CAF50"
                style={styles.slider}
              />
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall">1200</Text>
                <Text variant="bodySmall">3500</Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleSaveGoals}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Save & Continue
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
  },
  formContainer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputHalf: {
    width: '48%',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  goalDescription: {
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sliderContainer: {
    marginBottom: 24,
  },
  slider: {
    height: 40,
    marginBottom: 8,
    width: '100%',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    borderRadius: 8,
    marginTop: 16,
  },
  buttonContent: {
    height: 48,
  },
});
