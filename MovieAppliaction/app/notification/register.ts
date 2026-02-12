import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler behavior
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

// Register for push notifications and get token
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with your actual project ID from app.json
    });
    
    const token = tokenData.data;
    console.log('Push notification token:', token);

    // Save token to storage for later use
    await AsyncStorage.setItem('pushToken', token);

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('booking-updates', {
        name: 'Booking Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0066FF',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Get stored push token
export async function getPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('pushToken');
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Remove push token
export async function removePushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('pushToken');
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}
