import { sora_font } from "@/constant/sora";
import { configureNotificationHandler, registerForPushNotifications, setupNotificationListeners, removeNotificationListeners } from "@/services/push-service";

import { useLayoutFonts } from "@/hooks/use-fonts";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { Text } from "react-native";

export default function LayoutContent() {
  const { loaded, error } = useLayoutFonts(sora_font);

  useEffect(() => {
    configureNotificationHandler();
    setupNotificationListeners();
    registerForPushNotifications().catch((err: Error) => {
      console.error('Failed to register for push notifications:', err);
    });

    return () => {
      removeNotificationListeners();
    };
  }, []);

  if (!loaded) {
    return null;
  }
  if (error) {
    return <Text>Error loading fonts</Text>;
  }


  return (
    <Stack >
      <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Stack.Screen name="movie-details" options={{ title: "Movie Details", headerShown: false }} />
      <Stack.Screen name="schedule" options={{ title: "Schedule", headerShown: false }} />
      <Stack.Screen name="seats" options={{ title: "Select Seats", headerShown: false }} />
      <Stack.Screen name="checkout" options={{ title: "Checkout", headerShown: false }} />
      <Stack.Screen name="theatres" options={{ title: "Theatres", headerShown: false }} />
      <Stack.Screen name="order-confirmation" options={{ title: "Order Confirmed", headerShown: false }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications", headerShown: false }} />
      <Stack.Screen name="map" options={{ title: "Map", headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Settings", headerShown: false }} />
      <Stack.Screen name="genres" options={{ title: "Genres", headerShown: false }} />
      <Stack.Screen name="profile-settings" options={{ title: "Profile", headerShown: false }} />
      <Stack.Screen name="search-results" options={{ title: "Search Results", headerShown: false }} />
      <Stack.Screen name="auth" options={{ title: "Authentication", headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Register", headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
