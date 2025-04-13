import { useState, useRef } from 'react';
import { StyleSheet, View, FlatList, useWindowDimensions, Animated, Image } from 'react-native';
import { Text, Button, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  image: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: '1',
    title: 'Track Your Calories',
    description: 'Simply take a photo of your meal and our AI will calculate calories and macros for you.',
    image: 'food-apple',
  },
  {
    id: '2',
    title: 'Set Health Goals',
    description: 'Define your health goals and track your progress with our intuitive dashboard.',
    image: 'target',
  },
  {
    id: '3',
    title: 'Monitor Your Progress',
    description: 'View your history and analytics to stay on track with your nutrition goals.',
    image: 'chart-line',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < onboardingSteps.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Navigate to sign up when onboarding is complete
      router.replace('/auth/sign-up');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/auth/sign-up');
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingSteps.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index.toString()}
              style={[
                styles.dot,
                { 
                  width: dotWidth, 
                  opacity,
                  backgroundColor: theme.colors.primary 
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }: { item: OnboardingStep }) => {
    return (
      <View style={[styles.stepContainer, { width }]}>
        <View style={styles.imageContainer}>
          <LinearGradient
            colors={[theme.colors.primaryContainer, theme.colors.secondaryContainer]}
            style={styles.imageBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image 
              source={{ uri: `https://api.iconify.design/mdi/${item.image}.svg?color=white&width=120&height=120` }}
              style={styles.stepImage}
            />
          </LinearGradient>
        </View>
        
        <Surface style={styles.stepContent} elevation={0}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            {item.title}
          </Text>
          <Text variant="bodyLarge" style={styles.description}>
            {item.description}
          </Text>
        </Surface>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.skipContainer}>
        <Button 
          mode="text" 
          onPress={handleSkip}
          textColor={theme.colors.primary}
        >
          Skip
        </Button>
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingSteps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleNext}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          contentStyle={styles.buttonContent}
        >
          {currentIndex === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    alignItems: 'flex-end',
    padding: 16,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    marginBottom: 40,
  },
  imageBackground: {
    width: 200,
    height: 200,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepImage: {
    width: 120,
    height: 120,
  },
  stepContent: {
    padding: 24,
    borderRadius: 16,
    width: '100%',
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    padding: 24,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 52,
    paddingHorizontal: 16,
  },
});
