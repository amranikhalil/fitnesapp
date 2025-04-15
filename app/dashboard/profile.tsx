import { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, Avatar, Button, Surface, List, Switch, Divider, IconButton, useTheme, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/auth';
import { usePrograms } from '../../lib/programs/programs-context';
import { useMeals } from '../../lib/meals';
import { setupDatabase } from '../../lib/utils/setup-db';

export default function Profile() {
  const router = useRouter();
  const theme = useTheme();
  const { user, isGuestMode, signOut } = useAuth();
  const { selectedProgram, userMetrics } = usePrograms();
  const { dailyCalorieTarget } = useMeals();
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState(user?.email?.split('@')[0] || 'Guest User');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isSettingUpDb, setIsSettingUpDb] = useState(false);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handleEditProfile = () => {
    if (editing) {
      // Save profile changes
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditing(!editing);
  };
  
  const handleSelectImage = async () => {
    if (!editing) return;
    
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
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSetupDatabase = async () => {
    setIsSettingUpDb(true);
    try {
      const result = await setupDatabase();
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.message
      );
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to set up database: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsSettingUpDb(false);
    }
  };

  const renderUserInfo = () => {
    if (editing) {
      return (
        <TextInput
          mode="outlined"
          label="Name"
          value={userName}
          onChangeText={setUserName}
          style={styles.nameInput}
          autoCapitalize="words"
          activeOutlineColor={theme.colors.primary}
        />
      );
    }
    
    return (
      <View>
        <Text variant="headlineSmall" style={styles.userName}>{userName}</Text>
        <Text variant="bodyMedium" style={styles.userEmail}>
          {isGuestMode ? 'Guest Account' : user?.email || 'No email provided'}
        </Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <LinearGradient
        colors={['rgba(0, 120, 255, 0.1)', 'rgba(0, 120, 255, 0.05)', 'rgba(255, 255, 255, 0)']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>Profile</Text>
          <IconButton 
            icon={editing ? "check" : "pencil"}
            size={24} 
            onPress={handleEditProfile}
            iconColor={theme.colors.primary}
          />
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.profileCard} elevation={2}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleSelectImage}
              disabled={!editing}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Avatar.Icon 
                  size={90} 
                  icon="account"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              )}
              {editing && (
                <View style={styles.editAvatarOverlay}>
                  <IconButton 
                    icon="camera" 
                    size={20}
                    iconColor="white"
                    style={styles.editAvatarIcon}
                  />
                </View>
              )}
            </TouchableOpacity>
            
            {renderUserInfo()}
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={styles.statValue}>{dailyCalorieTarget}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Daily Goal</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="titleLarge" style={styles.statValue}>{selectedProgram?.name || 'None'}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Meal Plan</Text>
            </View>
          </View>
        </Surface>
        
        <Surface style={styles.settingsCard} elevation={2}>
          <Text variant="titleMedium" style={styles.settingsTitle}>App Settings</Text>
          
          <List.Item
            title="Dark Mode"
            description="Switch between light and dark theme"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={props => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Notifications"
            description="Remind me about meals and tracking"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={props => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Sync Data"
            description="Last synced: Today 10:30 AM"
            left={props => <List.Icon {...props} icon="cloud-sync" />}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Handle sync logic
            }}
          />
        </Surface>
        
        <Surface style={styles.settingsCard} elevation={2}>
          <Text variant="titleMedium" style={styles.settingsTitle}>Account</Text>
          
          <List.Item
            title="Update Nutrition Goals"
            description="Set your calorie and macronutrient targets"
            left={props => <List.Icon {...props} icon="target" />}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/dashboard/meal-program');
            }}
          />
          <Divider />
          <List.Item
            title="Privacy Settings"
            description="Manage your data and privacy"
            left={props => <List.Icon {...props} icon="shield-account" />}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to privacy settings
            }}
          />
          <Divider />
          <List.Item
            title="Export Data"
            description="Download your nutrition history"
            left={props => <List.Icon {...props} icon="export" />}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Handle export logic
            }}
          />
        </Surface>
        
        <Button
          mode="outlined"
          icon="database"
          onPress={handleSetupDatabase}
          loading={isSettingUpDb}
          style={styles.setupDbButton}
        >
          Set Up Statistics Database
        </Button>
        
        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={{ height: 50 }}
        >
          {isGuestMode ? 'Exit Guest Mode' : 'Sign Out'}
        </Button>
        
        <View style={styles.versionContainer}>
          <Text variant="bodySmall" style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarIcon: {
    margin: 0,
  },
  userName: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  userEmail: {
    textAlign: 'center',
    opacity: 0.7,
  },
  nameInput: {
    width: '100%',
    marginTop: 10,
    backgroundColor: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingsCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  settingsTitle: {
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 0,
  },
  logoutButton: {
    marginBottom: 24,
    borderRadius: 8,
    borderColor: 'rgba(231, 76, 60, 0.5)',
  },
  setupDbButton: {
    marginBottom: 24,
    borderRadius: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  versionText: {
    opacity: 0.5,
  },
});
