import { Tabs, useRouter, useRootNavigationState } from "expo-router";
import React, { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

import { registerForPushNotifications } from "../../utils/notifications";
import { FIREBASE_AUTH } from "../../FirebaseConfig";

/**
 * 🔔 Notification handler (safe location)
 * This file is mounted AFTER root layout
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  /**
   * 🔔 Register push token AFTER navigation is ready
   */
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    async function setupPushNotifications() {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) return;

      const token = await registerForPushNotifications();
      if (!token) return;

      console.log("🔥 FINAL PUSH TOKEN:", token);

      // TODO: replace with your real backend endpoint
      await fetch("https://your-backend.com/save-push-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          expoPushToken: token,
        }),
      });
    }

    setupPushNotifications();
  }, [rootNavigationState]);

  /**
   * 🔔 Handle notification taps (SAFE navigation)
   */
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (data?.type === "ORDER_PLACED" && data.orderId) {
          router.push(`/orders/${data.orderId}`);
        }

        if (data?.type === "ORDER_CANCELLED") {
          router.push("/orders");
        }
      });

    return () => subscription.remove();
  }, [rootNavigationState]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#E95322",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 7,
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="fast-food" color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart" color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="reorder"
        options={{
          title: "Reorder",
          tabBarIcon: ({ color }) => (
            <Ionicons name="repeat" color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" color={color} size={30} />
          ),
        }}
      />
    </Tabs>
  );
}
