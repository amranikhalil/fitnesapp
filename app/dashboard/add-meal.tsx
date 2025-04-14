import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, Surface, Chip, IconButton, useTheme, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { useMeals, FoodItem } from '../../lib/meals';
import { analyzeFoodImage } from '../../lib/services/vision-api';
import { config } from '../../lib/config';

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
  { id: 'breakfast', name: 'Breakfast', icon: 'food-croissant' },
  { id: 'lunch', name: 'Lunch', icon: 'food' },
  { id: 'dinner', name: 'Dinner', icon: 'food-turkey' },
  { id: 'snack', name: 'Snack', icon: 'food-apple' },
];

export default function AddMeal() {
  const router = useRouter();
  const theme = useTheme();
  const { addMeal } = useMeals();
  const [mealName, setMealName] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [foodItems, setFoodItems] = useState<typeof foodSuggestions>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  const handleTakePicture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
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
      // Process the image with AI
      processImageWithAI(result.assets[0].uri);
    }
  };

  const handleSelectImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
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
      // Process the image with AI
      processImageWithAI(result.assets[0].uri);
    }
  };

  const processImageWithAI = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => router.back()} 
            iconColor={theme.colors.primary}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>Add Meal</Text>
          <IconButton 
            icon="check" 
            size={24} 
            onPress={handleSaveMeal} 
            iconColor={theme.colors.primary}
            disabled={foodItems.length === 0}
          />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Meal Type Selection */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Meal Type</Text>
          <View style={styles.mealTypeContainer}>
            {mealTypes.map((type) => (
              <TouchableOpacity 
                key={type.id} 
                style={[
                  styles.mealTypeItem,
                  selectedMealType === type.id && { 
                    backgroundColor: theme.colors.primaryContainer,
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={() => handleSelectMealType(type.id)}
              >
                <Avatar.Icon 
                  size={40} 
                  icon={type.icon} 
                  color={selectedMealType === type.id ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  style={{ backgroundColor: 'transparent' }}
                />
                <Text 
                  variant="bodyMedium"
                  style={[
                    styles.mealTypeText,
                    selectedMealType === type.id && { color: theme.colors.primary }
                  ]}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meal Name Input */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Meal Name</Text>
          <TextInput
            mode="outlined"
            placeholder="Enter meal name"
            value={mealName}
            onChangeText={setMealName}
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
          />

          {/* Photo Capture */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Add Photo for AI Analysis</Text>
          <View style={styles.photoContainer}>
            {mealImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: mealImage }} style={styles.imagePreview} />
                <IconButton 
                  icon="close-circle" 
                  size={24} 
                  onPress={() => setMealImage(null)} 
                  style={styles.removeImageButton}
                  iconColor={theme.colors.error}
                />
              </View>
            ) : (
              <LinearGradient
                colors={[theme.colors.surfaceVariant, theme.colors.surface]}
                style={styles.photoPlaceholder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Avatar.Icon 
                  size={60} 
                  icon="camera-iris" 
                  style={{ backgroundColor: 'transparent', marginBottom: 12 }}
                  color={theme.colors.primary}
                />
                <Text variant="bodyLarge" style={styles.photoPlaceholderText}>
                  Take a photo of your meal for AI analysis
                </Text>
                <Text variant="bodySmall" style={[styles.photoPlaceholderText, { marginTop: 8 }]}>
                  Our AI will identify food items and calculate nutrition
                </Text>
                <Text variant="bodySmall" style={[styles.photoPlaceholderText, { marginTop: 4, fontStyle: 'italic' }]}>
                  {config.googleCloudVisionApiKey && config.googleCloudVisionApiKey !== 'YOUR_GOOGLE_CLOUD_VISION_API_KEY'
                    ? 'Powered by Google Cloud Vision'
                    : 'Demo Mode - No API Key Configured'}
                </Text>
              </LinearGradient>
            )}
            
            <View style={styles.photoButtonsContainer}>
              <Button 
                mode="contained" 
                onPress={handleTakePicture}
                style={[styles.photoButton, { backgroundColor: theme.colors.primary }]}
                icon="camera"
              >
                Camera
              </Button>
              <Button 
                mode="outlined" 
                onPress={handleSelectImage}
                style={styles.photoButton}
                textColor={theme.colors.primary}
                icon="image"
              >
                Gallery
              </Button>
            </View>
          </View>

          {isAnalyzing && (
            <Surface style={styles.analyzingContainer} elevation={0}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 16 }} />
                <Text variant="bodyLarge" style={{ textAlign: 'center', marginBottom: 8 }}>
                  Analyzing your meal...
                </Text>
                <Text variant="bodyMedium" style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)' }}>
                  Our AI is identifying food items and calculating nutrition
                </Text>
              </View>
            </Surface>
          )}

          {analysisError && (
            <Surface style={[styles.analyzingContainer, { backgroundColor: 'rgba(255, 0, 0, 0.05)' }]} elevation={0}>
              <Text variant="bodyLarge" style={{ textAlign: 'center', marginBottom: 8, color: theme.colors.error }}>
                Analysis Error
              </Text>
              <Text variant="bodyMedium" style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)' }}>
                {analysisError}
              </Text>
            </Surface>
          )}

          {analysisResult && !isAnalyzing && (
            <Surface style={[styles.analyzingContainer, { backgroundColor: 'rgba(0, 255, 0, 0.05)' }]} elevation={0}>
              <View style={styles.analysisResultHeader}>
                <Avatar.Icon 
                  size={36} 
                  icon="check-circle" 
                  style={{ backgroundColor: 'transparent' }}
                  color={theme.colors.primary}
                />
                <Text variant="titleMedium" style={{ color: theme.colors.primary, marginLeft: 8 }}>
                  Analysis Complete
                </Text>
              </View>
              
              <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
                {analysisResult.detectedItems.length} food {analysisResult.detectedItems.length === 1 ? 'item' : 'items'} detected with {Math.round(analysisResult.confidence * 100)}% confidence
              </Text>
              
              <View style={styles.detectedItemsChips}>
                {analysisResult.detectedItems.map((item, index) => (
                  <Chip 
                    key={index}
                    style={{ margin: 4, backgroundColor: theme.colors.primaryContainer }}
                    icon="food"
                  >
                    {item.name}
                  </Chip>
                ))}
              </View>
              
              <Text variant="bodySmall" style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)', marginTop: 8 }}>
                {analysisResult.message.includes('DEMO MODE') 
                  ? 'Using Demo Mode (No API Key)' 
                  : 'Powered by Google Cloud Vision'}
              </Text>
            </Surface>
          )}

          {/* Food Items */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Food Items</Text>
          <TextInput
            mode="outlined"
            placeholder="Search for food items"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            left={<TextInput.Icon icon="magnify" />}
          />

          {searchQuery && (
            <Surface style={styles.suggestionsContainer} elevation={1}>
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.suggestionItem}
                    onPress={() => handleAddFoodItem(item)}
                  >
                    <View>
                      <Text variant="bodyMedium">{item.name}</Text>
                      <Text variant="bodySmall" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                        {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                      </Text>
                    </View>
                    <IconButton icon="plus" size={20} onPress={() => handleAddFoodItem(item)} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No results found</Text>
              )}
            </Surface>
          )}

          {foodItems.length > 0 && (
            <Surface style={styles.selectedItemsContainer} elevation={0}>
              <Text variant="titleSmall" style={styles.selectedItemsTitle}>Selected Items</Text>
              
              {foodItems.map((item) => (
                <View key={item.id} style={styles.selectedItem}>
                  <View style={styles.selectedItemInfo}>
                    <Text variant="bodyMedium">{item.name}</Text>
                    <Text variant="bodySmall" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                      {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                    </Text>
                  </View>
                  <IconButton 
                    icon="close" 
                    size={20} 
                    onPress={() => handleRemoveFoodItem(item.id)}
                    iconColor={theme.colors.error}
                  />
                </View>
              ))}

              <View style={styles.nutritionSummary}>
                <Text variant="titleSmall" style={styles.nutritionSummaryTitle}>Total Nutrition</Text>
                <View style={styles.nutritionRow}>
                  <Chip 
                    icon="fire" 
                    style={[styles.nutritionChip, { backgroundColor: theme.colors.primaryContainer }]}
                  >
                    {totalCalories} calories
                  </Chip>
                  <Chip 
                    icon="food-drumstick" 
                    style={[styles.nutritionChip, { backgroundColor: theme.colors.secondaryContainer }]}
                  >
                    {totalProtein.toFixed(1)}g protein
                  </Chip>
                </View>
                <View style={styles.nutritionRow}>
                  <Chip 
                    icon="bread-slice" 
                    style={[styles.nutritionChip, { backgroundColor: theme.colors.secondaryContainer }]}
                  >
                    {totalCarbs.toFixed(1)}g carbs
                  </Chip>
                  <Chip 
                    icon="oil" 
                    style={[styles.nutritionChip, { backgroundColor: theme.colors.tertiaryContainer }]}
                  >
                    {totalFat.toFixed(1)}g fat
                  </Chip>
                </View>
              </View>
            </Surface>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSaveMeal}
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            disabled={foodItems.length === 0}
          >
            Save Meal
          </Button>
        </View>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mealTypeItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    width: '22%',
  },
  mealTypeText: {
    marginTop: 8,
    fontSize: 12,
  },
  photoContainer: {
    marginBottom: 24,
  },
  photoPlaceholder: {
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
  },
  photoPlaceholderText: {
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  analyzingContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    marginTop: -8,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  noResultsText: {
    padding: 16,
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  selectedItemsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  selectedItemsTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedItemInfo: {
    flex: 1,
  },
  nutritionSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  nutritionSummaryTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  nutritionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  nutritionChip: {
    marginRight: 8,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'white',
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 6,
  },
  analysisResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detectedItemsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
