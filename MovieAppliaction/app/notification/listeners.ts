import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import { router } from 'expo-router';

// Store subscription references
let notificationListener: Subscription | undefined;
let responseListener: Subscription | undefined;

// Setup notification listeners
export function setupNotificationListeners() {
  // Listener for when a notification is received while app is foregrounded
  notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    
    const { data } = notification.request.content;
    
    // Handle different notification types based on data
    if (data?.type === 'booking_confirmed') {
      console.log('Booking confirmation notification received');
      // You can show in-app notification or update UI
    }
  });

  // Listener for when user taps on a notification
  responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response:', response);
    
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data?.type === 'booking_confirmed') {
      // Navigate to bookings or home screen
      if (data?.bookingId) {
        router.push('/(tabs)/home');
      }
    } else if (data?.type === 'payment_confirmed') {
      // Navigate to orders or home screen
      router.push('/(tabs)/home');
    } else if (data?.type === 'order_confirmed' || data?.type === 'order_ready') {
      // Navigate to orders screen
      router.push('/(tabs)/home');
    } else if (data?.screen) {
      // Navigate to specific screen if provided
      router.push(data.screen as any);
    }
  });
}

// Remove notification listeners (call this on component unmount)
export function removeNotificationListeners() {
  if (notificationListener) {
    notificationListener.remove();
    notificationListener = undefined;
  }
  
  if (responseListener) {
    responseListener.remove();
    responseListener = undefined;
  }
}

// Get all scheduled notifications
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export async function getAllScheduledNotificationsAsync() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// Cancel a specific notification
export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel all notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Clear all delivered notifications from notification tray
export async function clearAllDeliveredNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

// Get notification badges (iOS)
export async function getBadgeCount() {
  return await Notifications.getBadgeCountAsync();
}

// Set notification badge (iOS)
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
