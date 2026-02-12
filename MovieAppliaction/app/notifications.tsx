import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { 
  useNotificationStore, 
  getNotificationIcon, 
  formatNotificationTime,
  NotificationItem 
} from '@/store/useNotifications';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Bell, BellOff, Check, CheckCheck, Trash2 } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NotificationsScreen() {
  const { colorScheme } = useTheme();
  const styles = getStyles(colorScheme as 'light' | 'dark');

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    loadNotifications 
  } = useNotificationStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleNotificationPress = (notification: NotificationItem) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate based on notification type
    const { data } = notification;
    if (data?.type === 'booking_confirmed' || data?.type === 'tickets_ready') {
      router.push('/(tabs)/profile');
    } else if (data?.type === 'new_movie' && data?.movieId) {
      router.push({ pathname: '/movie-details', params: { movie_id: String(data.movieId) } });
    } else if (data?.type === 'showtime_reminder' && data?.bookingId) {
      router.push('/(tabs)/profile');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeNotification(id) },
      ]
    );
  };

  const renderNotification = (notification: NotificationItem) => {
    const icon = getNotificationIcon(notification.type);
    const timeAgo = formatNotificationTime(notification.receivedAt);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[styles.notificationCard, !notification.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(notification)}
        onLongPress={() => handleDeleteNotification(notification.id)}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
          
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={
        colorScheme === 'dark'
          ? (layoutTheme.colors.gradients.darkPrimary as any)
          : (layoutTheme.colors.gradients.lightPrimary as any)
      }
      start={{ x: 0.9, y: 0.05 }}
      end={{ x: 0.9, y: 0.9 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.actionButton}>
                <CheckCheck color="#fff" size={20} />
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleClearAll} style={styles.actionButton}>
                <Trash2 color="#ff6b6b" size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentStyle}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <BellOff color="#666" size={64} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                You don't have any notifications yet. Book a movie to receive updates!
              </Text>
            </View>
          ) : (
            <>
              {/* Today's notifications */}
              {notifications.filter(n => isToday(n.receivedAt)).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today</Text>
                  {notifications
                    .filter(n => isToday(n.receivedAt))
                    .map(renderNotification)}
                </View>
              )}

              {/* Earlier notifications */}
              {notifications.filter(n => !isToday(n.receivedAt)).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Earlier</Text>
                  {notifications
                    .filter(n => !isToday(n.receivedAt))
                    .map(renderNotification)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const mode = (layoutTheme.modes as any)[colorScheme] ?? layoutTheme.modes.dark;
  const textPrimary = mode.text?.primary ?? '#fff';
  const textSecondary = mode.text?.secondary ?? 'rgba(255,255,255,0.7)';

  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 8,
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      color: textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    badge: {
      backgroundColor: '#ff6b6b',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      minWidth: 24,
      alignItems: 'center',
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      padding: 8,
    },
    scrollView: {
      flex: 1,
    },
    contentStyle: {
      padding: 16,
      paddingBottom: 100,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      color: textSecondary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    notificationCard: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    unreadCard: {
      backgroundColor: 'rgba(124,58,237,0.15)',
      borderColor: 'rgba(124,58,237,0.3)',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    iconText: {
      fontSize: 22,
    },
    contentContainer: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    notificationTitle: {
      color: textPrimary,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#7c3aed',
      marginLeft: 8,
    },
    notificationBody: {
      color: textSecondary,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 6,
    },
    timeText: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: 11,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
    },
    emptyTitle: {
      color: textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginTop: 20,
      marginBottom: 8,
    },
    emptyText: {
      color: textSecondary,
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 40,
      lineHeight: 20,
    },
  });
};
