import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, Surface, Chip, IconButton, useTheme, Avatar, Divider, RadioButton, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useMeals, FoodItem } from '../../lib/meals';
import { analyzeFoodImage } from '../../lib/services/vision-api';
import { config } from '../../lib/config';
import { useProfile } from '../../lib/auth/profile-context';

// Entry methods
type EntryMethod = 'manual' | 'ai';

// Mock data for food suggestions
const foodSuggestions = [
  { id: '1', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 },
  { id: '2', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { id: '3', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: '4', name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  { id: '5', name: 'Avocado', calories: 234, protein: 2.9, carbs: 12, fat: 21 },
  { id: '6', name: 'Salmon', calories: 206, protein: 22, carbs: 0, fat: 13 },
  { id: '7', name: 'Sweet Potato', calories: 112, protein: 2, carbs: 26, fat: 0.1 },
  { id: '8', name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.4 },
  { id: '9', name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: '10', name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14 },
];

// Meal types
const mealTypes = [
  { id: 'breakfast', name: 'Breakfast', icon: 'cafe-outline' },
  { id: 'lunch', name: 'Lunch', icon: 'fast-food-outline' },
  { id: 'dinner', name: 'Dinner', icon: 'restaurant-outline' },
  { id: 'snack', name: 'Snack', icon: 'nutrition-outline' },
];

export default function AddMeal() {
  const router = useRouter();
  const theme = useTheme();
  const { addMeal } = useMeals();
  const { aiCreditsAvailable, useAICredit } = useProfile();
  const [mealName, setMealName] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [foodItems, setFoodItems] = useState<typeof foodSuggestions>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [entryMethod, setEntryMethod] = useState<EntryMethod>('manual');
  
  // Manual food entry fields
  const [manualFoodName, setManualFoodName] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualServingSize, setManualServingSize] = useState('');

  // Calculate total nutrition
  const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = foodItems.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);

  const handleAddFoodItem = (item: typeof foodSuggestions[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFoodItems([...foodItems, item]);
    setSearchQuery('');
  };

  const handleRemoveFoodItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFoodItems(foodItems.filter(item => item.id !== id));
  };

  const handleSelectMealType = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMealType(id);
    // Set default meal name based on type
    if (!mealName) {
      const selectedType = mealTypes.find(type => type.id === id);
      if (selectedType) {
        setMealName(selectedType.name);
      }
    }
  };

  // Add manually entered food item
  const handleAddManualFoodItem = () => {
    if (!manualFoodName || !manualCalories) {
      // Basic validation
      alert('Please enter a food name and calories at minimum');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Create a new food item from manual entry
    const newItem = {
      id: Date.now().toString(),
      name: manualFoodName,
      calories: parseInt(manualCalories) || 0,
      protein: parseFloat(manualProtein) || 0,
      carbs: parseFloat(manualCarbs) || 0,
      fat: parseFloat(manualFat) || 0,
      servingSize: manualServingSize || undefined
    };

    // Add to list of items
    setFoodItems([...foodItems, newItem]);

    // Clear form
    setManualFoodName('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setManualCalories('');
    setManualServingSize('');

    // Provide feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Calculate calories from macros
  const calculateCaloriesFromMacros = () => {
    const protein = parseFloat(manualProtein) || 0;
    const carbs = parseFloat(manualCarbs) || 0;
    const fat = parseFloat(manualFat) || 0;

    // 4 calories per gram for protein and carbs, 9 for fat
    const calories = (protein * 4) + (carbs * 4) + (fat * 9);
    setManualCalories(Math.round(calories).toString());
  };

  // Listen for changes to macros to auto-calculate calories
  useEffect(() => {
    if (manualProtein || manualCarbs || manualFat) {
      calculateCaloriesFromMacros();
    }
  }, [manualProtein, manualCarbs, manualFat]);

  const handleTakePicture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Check for AI credits first if using AI mode
    if (entryMethod === 'ai') {
      if (aiCreditsAvailable <= 0) {
        alert('You have no AI credits left. Please switch to manual entry or purchase more credits.');
        return;
      }
    }
    
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setMealImage(result.assets[0].uri);
      // Process the image with AI if in AI mode
      if (entryMethod === 'ai') {
        processImageWithAI(result.assets[0].uri);
      }
    }
  };

  const handleSelectImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Check for AI credits first if using AI mode
    if (entryMethod === 'ai') {
      if (aiCreditsAvailable <= 0) {
        alert('You have no AI credits left. Please switch to manual entry or purchase more credits.');
        return;
      }
    }
    
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need media library permissions to make this work!');
      return;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setMealImage(result.assets[0].uri);
      // Process the image with AI if in AI mode
      if (entryMethod === 'ai') {
        processImageWithAI(result.assets[0].uri);
      }
    }
  };

  const processImageWithAI = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      // Use an AI credit
      if (entryMethod === 'ai') {
        const { success, remainingCredits } = await useAICredit();
        if (!success) {
          setAnalysisError('No AI credits available. Please switch to manual entry or purchase more credits.');
          setIsAnalyzing(false);
          return;
        }
      }
      
      // Get file info to check size
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (fileInfo.exists) {
        // Call the Google Cloud Vision API to analyze the image
        const result = await analyzeFoodImage(imageUri);
        if (result.success && result.detectedItems.length > 0) {
          setAnalysisResult(result);
          // Add the detected items to our food items list
          setFoodItems([...foodItems, ...result.detectedItems]);
          
          // Provide haptic feedback for successful detection
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setAnalysisError(result.message || "No food items detected. Please try again or add items manually.");
          
          // Provide haptic feedback for error
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        setAnalysisError("Image file not found. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setAnalysisError("An error occurred while processing the image.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Create a new meal object
    const newMeal = {
      id: Date.now().toString(), // Generate a unique ID
      name: mealName || mealTypes.find(type => type.id === selectedMealType)?.name || 'Meal',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      calories: totalCalories,
      items: foodItems,
      image: mealImage || undefined, // Include the meal image if available
    };
    
    console.log('Adding new meal with ID:', newMeal.id);
    // Add the meal using the context
    addMeal(newMeal);
    
    // Provide haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate back to dashboard
    router.back();
  };

  // Filter suggestions based on search query
  const filteredSuggestions = foodSuggestions.filter(
    item => item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
            />
            <Text variant="headlineSmall">Add Meal</Text>
            <View style={{width: 40}} />
          </View>
          
          <View style={styles.content}>
            {/* Entry Method Selector */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Choose Entry Method</Text>
            <SegmentedButtons
              value={entryMethod}
              onValueChange={(value) => setEntryMethod(value as EntryMethod)}
              buttons={[
                {
                  value: 'manual',
                  label: 'Manual Entry',
                  icon: 'pencil',
                },
                {
                  value: 'ai',
                  label: `AI Analysis (${aiCreditsAvailable} credits)`,
                  icon: 'camera',
                  disabled: aiCreditsAvailable <= 0
                },
              ]}
              style={styles.segmentedButtons}
            />
            
            {/* Meal Type Selection */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Meal Type</Text>
            <View style={styles.mealTypesContainer}>
              {mealTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.mealTypeItem,
                    selectedMealType === type.id && styles.mealTypeSelected,
                  ]}
                  onPress={() => handleSelectMealType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={selectedMealType === type.id ? theme.colors.primary : theme.colors.onBackground}
                  />
                  <Text
                    style={[
                      styles.mealTypeText,
                      selectedMealType === type.id && styles.mealTypeTextSelected,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Meal Name */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Meal Name</Text>
            <TextInput
              mode="outlined"
              label="Name your meal"
              value={mealName}
              onChangeText={setMealName}
              style={styles.input}
              activeOutlineColor={theme.colors.primary}
            />

            {/* Manual Entry Section */}
            {entryMethod === 'manual' && (
              <View style={styles.manualEntryContainer}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Manual Food Entry</Text>
                <Surface style={styles.manualEntrySurface}>
                  <TextInput
                    mode="outlined"
                    label="Food Name"
                    value={manualFoodName}
                    onChangeText={setManualFoodName}
                    style={styles.input}
                    autoCapitalize="words"
                    activeOutlineColor={theme.colors.primary}
                  />
                  
                  <View style={styles.macroInputsRow}>
                    <TextInput
                      mode="outlined"
                      label="Protein (g)"
                      value={manualProtein}
                      onChangeText={setManualProtein}
                      style={[styles.input, styles.macroInput]}
                      keyboardType="numeric"
                      activeOutlineColor={theme.colors.primary}
                    />
                    <TextInput
                      mode="outlined"
                      label="Carbs (g)"
                      value={manualCarbs}
                      onChangeText={setManualCarbs}
                      style={[styles.input, styles.macroInput]}
                      keyboardType="numeric"
                      activeOutlineColor={theme.colors.primary}
                    />
                    <TextInput
                      mode="outlined"
                      label="Fat (g)"
                      value={manualFat}
                      onChangeText={setManualFat}
                      style={[styles.input, styles.macroInput]}
                      keyboardType="numeric"
                      activeOutlineColor={theme.colors.primary}
                    />
                  </View>
                  
                  <TextInput
                    mode="outlined"
                    label="Calories"
                    value={manualCalories}
                    onChangeText={setManualCalories}
                    style={styles.input}
                    keyboardType="numeric"
                    activeOutlineColor={theme.colors.primary}
                  />
                  <TextInput
                    mode="outlined"
                    label="Serving Size"
                    value={manualServingSize}
                    onChangeText={setManualServingSize}
                    style={styles.input}
                    autoCapitalize="words"
                    activeOutlineColor={theme.colors.primary}
                  />
                  <Button 
                    mode="contained" 
                    onPress={handleAddManualFoodItem}
                    style={styles.addManualButton}
                    icon="plus"
                  >
                    Add Food Item
                  </Button>
                </Surface>
              </View>
            )}

            {/* AI Analysis Section */}
            {entryMethod === 'ai' && (
              <View style={styles.aiAnalysisContainer}>
                <Surface style={styles.aiCreditInfo}>
                  <Ionicons name="flash" size={24} color={aiCreditsAvailable > 0 ? theme.colors.primary : theme.colors.error} />
                  <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                    {aiCreditsAvailable} AI Credits Available
                  </Text>
                </Surface>
                
                {/* Image Input for AI Analysis */}
                <Surface style={styles.imageUploadContainer}>
                  {!mealImage ? (
                    <View style={styles.imageOptions}>
                      <Text variant="titleMedium" style={styles.imageUploadText}>
                        Take or select a photo of your meal for AI analysis
                      </Text>
                      <View style={styles.imageButtonsContainer}>
                        <Button 
                          mode="contained"
                          icon="camera" 
                          onPress={handleTakePicture}
                          style={styles.imageButton}
                          disabled={aiCreditsAvailable <= 0}
                        >
                          Take Photo
                        </Button>
                        <Button 
                          mode="contained"
                          icon="image" 
                          onPress={handleSelectImage}
                          style={styles.imageButton}
                          disabled={aiCreditsAvailable <= 0}
                        >
                          Choose Photo
                        </Button>
                      </View>
                      {aiCreditsAvailable <= 0 && (
                        <Text style={styles.errorText}>
                          You need credits to use AI analysis. Get more credits or switch to manual entry.
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: mealImage }} style={styles.imagePreview} />
                      <View style={styles.imageOverlay}>
                        <IconButton
                          icon="refresh"
                          size={24}
                          onPress={() => {
                            setMealImage(null);
                            setAnalysisResult(null);
                            setAnalysisError(null);
                          }}
                          style={styles.retakeButton}
                          mode="contained"
                        />
                      </View>
                      {isAnalyzing && (
                        <View style={styles.analysisOverlay}>
                          <ActivityIndicator size="large" color={theme.colors.primary} />
                          <Text style={styles.analysisText}>Analyzing your meal...</Text>
                        </View>
                      )}
                    </View>
                  )}
                </Surface>

                {/* Analysis Results or Error */}
                {analysisError && (
                  <Surface style={[styles.analysisFeedback, styles.analysisError]}>
                    <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
                    <Text style={styles.errorText}>{analysisError}</Text>
                  </Surface>
                )}

                {analysisResult && (
                  <Surface style={[styles.analysisFeedback, styles.analysisSuccess]}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    <Text style={styles.successText}>
                      Successfully identified {analysisResult.detectedItems.length} items in your meal!
                    </Text>
                  </Surface>
                )}
              </View>
            )}

            {/* Current Food Items */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Food Items</Text>
            <Surface style={styles.foodItemsContainer}>
              {foodItems.length === 0 ? (
                <Text style={styles.emptyText}>No food items added yet</Text>
              ) : (
                foodItems.map((item) => (
                  <Surface key={item.id} style={styles.foodItem}>
                    <View style={styles.foodItemContent}>
                      <Text variant="titleMedium">{item.name}</Text>
                      <View style={styles.macrosContainer}>
                        <Chip icon="fire" style={styles.macroChip}>{item.calories} cal</Chip>
                        {item.protein > 0 && <Chip icon="arm-flex" style={styles.macroChip}>{item.protein}g protein</Chip>}
                        {item.carbs > 0 && <Chip icon="barley" style={styles.macroChip}>{item.carbs}g carbs</Chip>}
                        {item.fat > 0 && <Chip icon="oil" style={styles.macroChip}>{item.fat}g fat</Chip>}
                      </View>
                    </View>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleRemoveFoodItem(item.id)}
                      style={styles.removeButton}
                    />
                  </Surface>
                ))
              )}

              {/* Food Search for Quick Adding */}
              <TextInput
                mode="outlined"
                label="Quick search for foods"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                right={<TextInput.Icon icon="magnify" />}
                activeOutlineColor={theme.colors.primary}
              />

              {/* Food Suggestions */}
              {searchQuery.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {foodSuggestions
                    .filter(item => 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.suggestionItem}
                        onPress={() => handleAddFoodItem(item)}
                      >
                        <Text>{item.name}</Text>
                        <Text style={styles.suggestionCalories}>{item.calories} cal</Text>
                      </TouchableOpacity>
                    ))
                  }
                </View>
              )}
            </Surface>

            {/* Nutrition Summary */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Nutrition Summary</Text>
            <Surface style={styles.nutritionSummary}>
              <View style={styles.nutritionItem}>
                <Text variant="titleMedium">Calories</Text>
                <Text variant="titleLarge">{totalCalories}</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleMedium">Protein</Text>
                <Text variant="titleLarge">{totalProtein}g</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleMedium">Carbs</Text>
                <Text variant="titleLarge">{totalCarbs}g</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text variant="titleMedium">Fat</Text>
                <Text variant="titleLarge">{totalFat}g</Text>
              </View>
            </Surface>

            {/* Save Button */}
            <Button
              mode="contained"
              onPress={handleSaveMeal}
              style={styles.saveButton}
              labelStyle={styles.saveButtonLabel}
              disabled={foodItems.length === 0 || !mealName}
            >
              Save Meal
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  mealTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealTypeItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    minWidth: 80,
  },
  mealTypeSelected: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    borderColor: 'rgba(98, 0, 238, 0.5)',
  },
  mealTypeText: {
    marginTop: 4,
    textAlign: 'center',
  },
  mealTypeTextSelected: {
    color: 'rgba(98, 0, 238, 1)',
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  manualEntryContainer: {
    marginBottom: 24,
  },
  manualEntrySurface: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  macroInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  aiAnalysisContainer: {
    marginBottom: 24,
  },
  aiCreditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  imageUploadContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  imageOptions: {
    padding: 24,
    alignItems: 'center',
  },
  imageUploadText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  imageButton: {
    marginHorizontal: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 300,
    width: '100%',
  },
  imagePreview: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  analysisOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  analysisFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  analysisError: {
    backgroundColor: 'rgba(255,0,0,0.05)',
  },
  analysisSuccess: {
    backgroundColor: 'rgba(0,255,0,0.05)',
  },
  errorText: {
    color: 'red',
    marginLeft: 8,
    flex: 1,
  },
  successText: {
    color: 'green',
    marginLeft: 8,
    flex: 1,
  },
  foodItemsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  foodItemContent: {
    flex: 1,
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  macroChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  removeButton: {
    marginLeft: 8,
  },
  searchInput: {
    marginTop: 16,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suggestionCalories: {
    opacity: 0.6,
  },
  nutritionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  saveButton: {
    marginVertical: 24,
    paddingVertical: 8,
    borderRadius: 28,
  },
  saveButtonLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
  addManualButton: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 6,
  },
});
