import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data: Record<string, any>;
  receivedAt: string;
  scheduledAt?: string | null;
  read: boolean;
  type?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<NotificationItem, 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  loadNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: NotificationItem = {
          ...notification,
          read: false,
          type: notification.data?.type,
        };

        set((state) => {
          // Avoid duplicates
          if (state.notifications.some(n => n.id === notification.id)) {
            return state;
          }
          
          const updated = [newNotification, ...state.notifications].slice(0, 100); // Keep last 100
          return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.read).length,
          };
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const updated = state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.read).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const updated = state.notifications.filter(n => n.id !== id);
          return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.read).length,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      loadNotifications: async () => {
        // Notifications are auto-loaded via persist middleware
        // This can be used for manual refresh or migration
        const state = get();
        set({
          unreadCount: state.notifications.filter(n => !n.read).length,
        });
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.unreadCount = state.notifications.filter(n => !n.read).length;
        }
      },
    }
  )
);

// Helper function to get notification icon based on type
export function getNotificationIcon(type?: string): string {
  switch (type) {
    case 'booking_confirmed':
      return '🎬';
    case 'payment_confirmed':
      return '💳';
    case 'showtime_reminder':
      return '⏰';
    case 'tickets_ready':
      return '🎟️';
    case 'new_movie':
      return '🆕';
    case 'promotion':
      return '🎉';
    default:
      return '🔔';
  }
}

// Helper function to format notification time
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
