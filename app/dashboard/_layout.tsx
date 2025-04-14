import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardLayout() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style="auto" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="meal-program"
          options={{
            title: 'Meal Program',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="nutrition-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add-meal"
          options={{
            href: null, // Hide this from the tab bar
          }}
        />
        <Tabs.Screen
          name="meal-details"
          options={{
            href: null, // Hide this from the tab bar
          }}
        />
      </Tabs>
    </>
  );
}
