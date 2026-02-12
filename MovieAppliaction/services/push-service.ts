import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useNotificationStore } from '@/store/useNotifications';

// Store subscription references for cleanup
let notificationListener: Notifications.EventSubscription | null = null;
let responseListener: Notifications.EventSubscription | null = null;

/**
 * Configure how notifications are handled when the app is in foreground
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Register for push notifications and get the Expo push token
 * @returns {Promise<string | null>} - Expo push token or null if not available
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;
    console.log('Expo push token:', token);

    // Store token for later use (e.g., sending to your backend)
    await AsyncStorage.setItem('expoPushToken', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('movie-bookings', {
      name: 'Movie Bookings',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions & Offers',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Showtime Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  return token;
}

/**
 * Set up notification listeners for received and interacted notifications
 */
export function setupNotificationListeners() {
  // Listener for notifications received while app is foregrounded
  notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    
    // Add to Zustand store
    const { identifier, content } = notification.request;
    useNotificationStore.getState().addNotification({
      id: identifier,
      title: content.title || '',
      body: content.body || '',
      data: content.data || {},
      receivedAt: new Date().toISOString(),
    });
  });

  // Listener for when user taps on a notification
  responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response:', response);
    const data = response.notification.request.content.data;
    
    // Handle navigation based on notification type
    // You can use router.push() here if needed
    if (data.type === 'booking_confirmed') {
      // Navigate to bookings/profile
      console.log('Navigate to booking:', data.bookingId);
    } else if (data.type === 'showtime_reminder') {
      // Navigate to ticket QR code
      console.log('Navigate to ticket for booking:', data.bookingId);
    } else if (data.type === 'new_movie') {
      // Navigate to movie details
      console.log('Navigate to movie:', data.movieId);
    }
  });
}

/**
 * Remove notification listeners (call on cleanup)
 */
export function removeNotificationListeners() {
  if (notificationListener) {
    notificationListener.remove();
    notificationListener = null;
  }
  if (responseListener) {
    responseListener.remove();
    responseListener = null;
  }
}

/**
 * Get stored push token
 * @returns {Promise<string | null>} - Stored push token
 */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('expoPushToken');
  } catch {
    return null;
  }
}

/**
 * Send booking confirmation notification for movie tickets
 * @param {Object} bookingDetails - Booking information
 * @param {string} bookingDetails.movieTitle - Movie title
 * @param {string} bookingDetails.theatreName - Theatre name
 * @param {string} bookingDetails.showTime - Show time (ISO string)
 * @param {number} bookingDetails.ticketCount - Number of tickets
 * @param {string} bookingDetails.seatLabels - Seat labels (e.g., "A1, A2")
 * @param {number} bookingDetails.totalPrice - Total booking price
 * @param {string} bookingDetails.bookingId - Unique booking ID
 * @returns {Promise<string>} - Notification identifier
 */
export async function sendBookingConfirmationNotification(bookingDetails: {
  movieTitle: string;
  theatreName?: string;
  showTime?: string;
  ticketCount: number;
  seatLabels: string;
  totalPrice: number;
  bookingId: string;
}) {
  const { movieTitle, theatreName, showTime, ticketCount, seatLabels, totalPrice, bookingId } = bookingDetails;

  const title = '🎬 Booking Confirmed!';
  const showTimeFormatted = showTime 
    ? new Date(showTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    : '';
  const body = `Your ${ticketCount} ${ticketCount === 1 ? 'ticket' : 'tickets'} for "${movieTitle}" ${showTimeFormatted ? `at ${showTimeFormatted}` : ''} - Seats: ${seatLabels}. Total: $${totalPrice.toFixed(2)}`;

  const data = {
    type: 'booking_confirmed',
    movieTitle,
    theatreName,
    showTime,
    ticketCount,
    seatLabels,
    totalPrice,
    bookingId,
    timestamp: new Date().toISOString(),
  };

  return await sendLocalNotification({ title, body, data });
}

/**
 * Send a local push notification immediately
 * @param {Object} params - Notification parameters
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {Object} params.data - Additional data
 * @returns {Promise<string>} - Notification identifier
 */
export async function sendLocalNotification({ 
  title, 
  body, 
  data = {} 
}: { 
  title: string; 
  body: string; 
  data?: Record<string, any>;
}) {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...data,
          title,
          body,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        badge: 1,
      },
      trigger: null, // null means send immediately
    });

    // Save to notification history
    await saveNotificationToHistory({
      id: notificationId,
      title,
      body,
      data: {
        ...data,
        title,
        body,
      },
    });

    console.log('Local notification sent:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error sending local notification:', error);
    throw error;
  }
}

/**
 * Schedule a showtime reminder notification
 * @param {Object} params - Reminder parameters
 * @param {string} params.movieTitle - Movie title
 * @param {string} params.showTime - Show time (ISO string)
 * @param {string} params.theatreName - Theatre name
 * @param {string} params.seatLabels - Seat labels
 * @param {string} params.bookingId - Booking ID
 * @param {number} params.minutesBefore - Minutes before showtime to remind (default: 60)
 * @returns {Promise<string>} - Notification identifier
 */
export async function scheduleShowtimeReminder({
  movieTitle,
  showTime,
  theatreName,
  seatLabels,
  bookingId,
  minutesBefore = 60,
}: {
  movieTitle: string;
  showTime: string;
  theatreName?: string;
  seatLabels: string;
  bookingId: string;
  minutesBefore?: number;
}) {
  try {
    const showDate = new Date(showTime);
    const reminderTime = new Date(showDate.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();

    // Don't schedule if reminder time has passed
    if (reminderTime <= now) {
      console.log('Reminder time has passed, not scheduling');
      return null;
    }

    const secondsUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);

    const title = '🎥 Movie Starting Soon!';
    const body = `"${movieTitle}" starts in ${minutesBefore} minutes${theatreName ? ` at ${theatreName}` : ''}. Seats: ${seatLabels}`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'showtime_reminder',
          movieTitle,
          showTime,
          theatreName,
          seatLabels,
          bookingId,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilReminder,
      },
    });

    // Save to notification history
    await saveNotificationToHistory({
      id: notificationId,
      title,
      body,
      data: {
        type: 'showtime_reminder',
        movieTitle,
        showTime,
        theatreName,
        seatLabels,
        bookingId,
      },
      scheduledAt: reminderTime.toISOString(),
    });

    console.log('Showtime reminder scheduled:', notificationId, 'for', reminderTime.toISOString());
    return notificationId;
  } catch (error) {
    console.error('Error scheduling showtime reminder:', error);
    throw error;
  }
}

/**
 * Send payment confirmation notification
 * @param {Object} paymentDetails - Payment information
 * @param {number} paymentDetails.amount - Payment amount
 * @param {string} paymentDetails.cardLast4 - Last 4 digits of card
 * @param {string} paymentDetails.paymentMethod - Payment method (card, mobile, bank)
 * @param {string} paymentDetails.bookingId - Related booking ID
 * @returns {Promise<string>} - Notification identifier
 */
export async function sendPaymentConfirmationNotification(paymentDetails: {
  amount: number;
  cardLast4?: string;
  paymentMethod: string;
  bookingId: string;
}) {
  const { amount, cardLast4, paymentMethod, bookingId } = paymentDetails;

  const title = '💳 Payment Successful';
  const methodText = paymentMethod === 'card' && cardLast4 
    ? `via card ending in ${cardLast4}` 
    : `via ${paymentMethod}`;
  const body = `Your payment of $${amount.toFixed(2)} ${methodText} has been processed successfully!`;

  const data = {
    type: 'payment_confirmed',
    amount,
    cardLast4,
    paymentMethod,
    bookingId,
    timestamp: new Date().toISOString(),
  };

  return await sendLocalNotification({ title, body, data });
}

/**
 * Send ticket ready notification (QR code available)
 * @param {Object} params - Ticket parameters
 * @param {string} params.movieTitle - Movie title
 * @param {number} params.ticketCount - Number of tickets
 * @param {string} params.bookingId - Booking ID
 * @returns {Promise<string>} - Notification identifier
 */
export async function sendTicketReadyNotification({
  movieTitle,
  ticketCount,
  bookingId,
}: {
  movieTitle: string;
  ticketCount: number;
  bookingId: string;
}) {
  const title = '🎟️ Your Tickets are Ready!';
  const body = `Your ${ticketCount} ${ticketCount === 1 ? 'ticket' : 'tickets'} for "${movieTitle}" ${ticketCount === 1 ? 'is' : 'are'} ready. Open the app to view your QR ${ticketCount === 1 ? 'code' : 'codes'}.`;

  const data = {
    type: 'tickets_ready',
    movieTitle,
    ticketCount,
    bookingId,
  };

  return await sendLocalNotification({ title, body, data });
}

/**
 * Send new movie release notification
 * @param {Object} params - Movie parameters
 * @param {string} params.movieTitle - Movie title
 * @param {string} params.releaseDate - Release date
 * @param {number} params.movieId - Movie ID for navigation
 * @returns {Promise<string>} - Notification identifier
 */
export async function sendNewMovieNotification({
  movieTitle,
  releaseDate,
  movieId,
}: {
  movieTitle: string;
  releaseDate?: string;
  movieId: number;
}) {
  const title = '🆕 New Movie Available!';
  const body = `"${movieTitle}" is now showing! Book your tickets today.`;

  const data = {
    type: 'new_movie',
    movieTitle,
    releaseDate,
    movieId,
  };

  return await sendLocalNotification({ title, body, data });
}

/**
 * Send special promotion notification
 * @param {Object} params - Promotion parameters
 * @param {string} params.promoTitle - Promotion title
 * @param {string} params.description - Promotion description
 * @param {number} params.discountPercent - Discount percentage
 * @param {string} params.promoCode - Promo code
 * @param {string} params.expiresAt - Expiration date
 * @returns {Promise<string>} - Notification identifier
 */

/**
 * Save notification history to AsyncStorage and Zustand store
 */
export async function saveNotificationToHistory(notification: {
  id: string;
  title: string;
  body: string;
  data: Record<string, any>;
  scheduledAt?: string;
}) {
  try {
    // Save to Zustand store (persisted to AsyncStorage automatically)
    useNotificationStore.getState().addNotification({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      receivedAt: new Date().toISOString(),
      scheduledAt: notification.scheduledAt || null,
    });
  } catch (error) {
    console.error('Error saving notification to history:', error);
  }
}

/**
 * Get notification history from Zustand store
 * @returns {Array} - Array of notification items
 */
export function getNotificationHistory() {
  return useNotificationStore.getState().notifications;
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID to mark as read
 */
export function markNotificationAsRead(notificationId: string) {
  useNotificationStore.getState().markAsRead(notificationId);
}

/**
 * Get unread notification count
 * @returns {number} - Number of unread notifications
 */
export function getUnreadNotificationCount(): number {
  return useNotificationStore.getState().unreadCount;
}

/**
 * Clear notification history
 */
export function clearNotificationHistory() {
  useNotificationStore.getState().clearAll();
}

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - Notification ID to cancel
 */
export async function cancelScheduledNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Cancelled notification:', notificationId);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}