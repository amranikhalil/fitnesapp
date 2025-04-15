import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, Dimensions, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Text, Surface, useTheme, Button, Chip, ProgressBar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStatistics, PlantStage } from '../../lib/statistics/statistics-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, parseISO } from 'date-fns';

// Plant images for different growth stages using emoji representations
const plantStageEmojis: Record<PlantStage, string> = {
  [PlantStage.SEED]: '🌱',
  [PlantStage.SPROUT]: '🌿',
  [PlantStage.SMALL_PLANT]: '🌵',
  [PlantStage.MEDIUM_PLANT]: '🌴',
  [PlantStage.LARGE_PLANT]: '🌲',
  [PlantStage.FLOWERING]: '🌺',
  [PlantStage.MATURE]: '🌳',
};

// Plant stage descriptions
const plantStageDescriptions: Record<PlantStage, string> = {
  [PlantStage.SEED]: "Just starting out! Meet your goals to help me grow.",
  [PlantStage.SPROUT]: "I've sprouted! Keep up the good work to help me grow more.",
  [PlantStage.SMALL_PLANT]: "Growing steadily! Your consistency is paying off.",
  [PlantStage.MEDIUM_PLANT]: "Look at me grow! You're doing great with your nutrition goals.",
  [PlantStage.LARGE_PLANT]: "I'm getting bigger! Your dedication is impressive.",
  [PlantStage.FLOWERING]: "I'm starting to flower! Your commitment to health is inspiring.",
  [PlantStage.MATURE]: "Fully grown! You've mastered your nutrition goals. Amazing work!",
};

// Chart configuration
const screenWidth = Dimensions.get('window').width - 40;
const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(78, 126, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#4E7EFF'
  }
};

// Tab options for the statistics view
type StatTab = 'plant' | 'calories' | 'macros';

export default function Statistics() {
  const theme = useTheme();
  const { stats, isLoading, error, updateDailyStats } = useStatistics();
  const [activeTab, setActiveTab] = useState<StatTab>('plant');
  
  // Format the last 7 days for chart display
  const formatWeeklyData = () => {
    // Sort stats by date
    const sortedStats = [...stats.weeklyStats].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Default to last 7 days if no data
    const labels: string[] = [];
    const caloriesData: number[] = [];
    const proteinData: number[] = [];
    const carbsData: number[] = [];
    const fatData: number[] = [];
    
    // Fill in empty days with zeros for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const existingStat = sortedStats.find(s => s.date === date);
      
      labels.push(format(subDays(new Date(), i), 'E')); // Day of week (Mon, Tue, etc.)
      
      if (existingStat) {
        caloriesData.push(existingStat.caloriesConsumed);
        proteinData.push(existingStat.proteinConsumed);
        carbsData.push(existingStat.carbsConsumed);
        fatData.push(existingStat.fatConsumed);
      } else {
        caloriesData.push(0);
        proteinData.push(0);
        carbsData.push(0);
        fatData.push(0);
      }
    }
    
    return { labels, caloriesData, proteinData, carbsData, fatData };
  };
  
  // Get the data for the charts
  const { labels, caloriesData, proteinData, carbsData, fatData } = formatWeeklyData();
  
  // Calories chart data
  const caloriesChartData = {
    labels,
    datasets: [
      {
        data: caloriesData,
        color: (opacity = 1) => `rgba(78, 126, 255, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ['Calories']
  };
  
  // Macros chart data
  const macrosChartData = {
    labels,
    datasets: [
      {
        data: proteinData,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: carbsData,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: fatData,
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ['Protein', 'Carbs', 'Fat']
  };
  
  // Display plant stage name
  const getPlantStageName = (stage: PlantStage): string => {
    switch (stage) {
      case PlantStage.SEED: return 'Seed';
      case PlantStage.SPROUT: return 'Sprout';
      case PlantStage.SMALL_PLANT: return 'Small Plant';
      case PlantStage.MEDIUM_PLANT: return 'Medium Plant';
      case PlantStage.LARGE_PLANT: return 'Large Plant';
      case PlantStage.FLOWERING: return 'Flowering Plant';
      case PlantStage.MATURE: return 'Mature Plant';
      default: return 'Unknown';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Progress Tracker</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'plant' && styles.activeTab]} 
          onPress={() => setActiveTab('plant')}
        >
          <Text style={activeTab === 'plant' ? styles.activeTabText : styles.tabText}>Plant</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'calories' && styles.activeTab]} 
          onPress={() => setActiveTab('calories')}
        >
          <Text style={activeTab === 'calories' ? styles.activeTabText : styles.tabText}>Calories</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'macros' && styles.activeTab]} 
          onPress={() => setActiveTab('macros')}
        >
          <Text style={activeTab === 'macros' ? styles.activeTabText : styles.tabText}>Macros</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {activeTab === 'plant' && (
          <View style={styles.plantSection}>
            <Surface style={styles.plantCard}>
              <Text variant="titleLarge" style={styles.plantTitle}>
                Your Nutrition Plant
              </Text>
              
              <View style={styles.plantImageContainer}>
                <Text style={styles.plantImage}>{plantStageEmojis[stats.plantStage]}</Text>
              </View>
              
              <View style={styles.plantInfo}>
                <Text variant="titleMedium">{getPlantStageName(stats.plantStage)}</Text>
                <ProgressBar 
                  progress={stats.plantProgress / 100} 
                  color={theme.colors.primary} 
                  style={styles.progressBar}
                />
                <Text variant="bodyMedium" style={styles.progressText}>
                  {stats.plantProgress}% to next stage
                </Text>
                <Text style={styles.plantDescription}>
                  {plantStageDescriptions[stats.plantStage]}
                </Text>
              </View>
              
              <View style={styles.streakContainer}>
                <Ionicons name="flame" size={24} color={theme.colors.secondary} />
                <Text variant="titleMedium" style={styles.streakText}>
                  {stats.streakDays} Day{stats.streakDays !== 1 ? 's' : ''} Streak!
                </Text>
              </View>
            </Surface>
            
            <Surface style={styles.tipsCard}>
              <Text variant="titleMedium">How to Grow Your Plant</Text>
              <Divider style={styles.divider} />
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.tipText}>Meet your calorie goals (±5%)</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.tipText}>Reach your protein target</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.tipText}>Stay within your carbs limit</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.tipText}>Stay within your fat limit</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.tipText}>Drink enough water daily</Text>
              </View>
            </Surface>
          </View>
        )}
        
        {activeTab === 'calories' && (
          <View style={styles.chartSection}>
            <Surface style={styles.chartCard}>
              <Text variant="titleMedium" style={styles.chartTitle}>7-Day Calories</Text>
              <LineChart
                data={caloriesChartData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
              
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#4E7EFF' }]} />
                  <Text>Calories</Text>
                </View>
              </View>
            </Surface>
            
            <Surface style={styles.statsCard}>
              <Text variant="titleMedium">Daily Average</Text>
              <Text variant="displaySmall" style={styles.avgNumber}>
                {Math.round(caloriesData.reduce((sum, val) => sum + val, 0) / caloriesData.length)} cal
              </Text>
              <Text variant="bodyMedium">Your daily target: {stats.weeklyStats[0]?.caloriesGoal || 2000} cal</Text>
            </Surface>
          </View>
        )}
        
        {activeTab === 'macros' && (
          <View style={styles.chartSection}>
            <Surface style={styles.chartCard}>
              <Text variant="titleMedium" style={styles.chartTitle}>7-Day Macronutrients</Text>
              <LineChart
                data={macrosChartData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
              
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                  <Text>Protein (g)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
                  <Text>Carbs (g)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                  <Text>Fat (g)</Text>
                </View>
              </View>
            </Surface>
            
            <Surface style={styles.macroStatsCard}>
              <Text variant="titleMedium" style={styles.macroStatsTitle}>Daily Averages</Text>
              
              <View style={styles.macroStatRow}>
                <View style={styles.macroStat}>
                  <Text variant="labelLarge">Protein</Text>
                  <Chip icon="arm-flex" style={[styles.macroChip, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                    {Math.round(proteinData.reduce((sum, val) => sum + val, 0) / proteinData.length)}g
                  </Chip>
                </View>
                
                <View style={styles.macroStat}>
                  <Text variant="labelLarge">Carbs</Text>
                  <Chip icon="barley" style={[styles.macroChip, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                    {Math.round(carbsData.reduce((sum, val) => sum + val, 0) / carbsData.length)}g
                  </Chip>
                </View>
                
                <View style={styles.macroStat}>
                  <Text variant="labelLarge">Fat</Text>
                  <Chip icon="oil" style={[styles.macroChip, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                    {Math.round(fatData.reduce((sum, val) => sum + val, 0) / fatData.length)}g
                  </Chip>
                </View>
              </View>
              
              <Text variant="bodyMedium" style={styles.targetText}>
                Your targets: {stats.weeklyStats[0]?.proteinGoal || 120}g protein, {stats.weeklyStats[0]?.carbsGoal || 250}g carbs, {stats.weeklyStats[0]?.fatGoal || 65}g fat
              </Text>
            </Surface>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4E7EFF',
  },
  tabText: {
    color: '#1A1C1E',
    opacity: 0.7,
  },
  activeTabText: {
    color: '#4E7EFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  plantSection: {
    marginBottom: 20,
  },
  plantCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  plantTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  plantImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    marginBottom: 20,
  },
  plantImage: {
    fontSize: 120,
  },
  plantInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginVertical: 10,
  },
  progressText: {
    marginBottom: 10,
  },
  plantDescription: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 138, 101, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  streakText: {
    marginLeft: 8,
    color: '#FF8A65',
  },
  tipsCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    marginLeft: 12,
  },
  chartSection: {
    marginBottom: 20,
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  avgNumber: {
    marginVertical: 8,
    color: '#4E7EFF',
  },
  macroStatsCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  macroStatsTitle: {
    marginBottom: 16,
  },
  macroStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroStat: {
    alignItems: 'center',
  },
  macroChip: {
    marginTop: 8,
  },
  targetText: {
    textAlign: 'center',
    opacity: 0.8,
  },
});
