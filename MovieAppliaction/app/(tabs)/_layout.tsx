import { Tabs } from "expo-router";
import { Bookmark, Search, User, Home, Ticket } from "lucide-react-native";
import { View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: 'rgba(35, 35, 35, 0.72)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          height: 64,
          position: 'absolute',
          marginHorizontal: '10%',
          bottom: 16,
          elevation: 12,
          width: '80%',
          borderRadius: 34,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 18,
          alignItems: 'center',
        },
        tabBarItemStyle: {
          marginTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Home color={color} size={size} fill={focused ? color : 'none'} />
          ),
        }}
      />

      <Tabs.Screen
        name="ticketsBook"
        options={{
          title: 'Book',
          tabBarIcon: ({ color, size, focused }) => (
            <Ticket color={color} size={size} fill={focused ? color : 'none'} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
            tabBarIcon: ({}) => {
              const outer = 84; // outer (glass) diameter; constant and larger than navbar height
              const inner = 64; // inner (gradient) diameter
              const translateY = -20; // lift the element above the tab bar
              const iconSize = Math.round(inner * 0.5);

            return (
              <View
                style={{
                  width: outer,
                  height: outer,
                  borderRadius: outer / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ translateY }],
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  elevation: 8,
                }}
              >
                <LinearGradient
                  colors={['#FF6FD8', '#3813C2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: inner,
                    height: inner,
                    borderRadius: inner / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Search color="#fff" size={iconSize} />
                </LinearGradient>
              </View>
            );
          },
        }}
      />

      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color, size, focused }) => (
            <Bookmark color={color} size={size} fill={focused ? color : 'none'} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <User color={color} size={size} fill={focused ? color : 'none'} />
          ),
        }}
      />
    </Tabs>
  );
}
