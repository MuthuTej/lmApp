import { Stack } from "expo-router";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    async function testPush() {
      console.log("🚀 ROOT LAYOUT MOUNTED");

      if (!Device.isDevice) {
        console.log("❌ NOT A REAL DEVICE");
        return;
      }

      const perm = await Notifications.requestPermissionsAsync();
      console.log("🔐 PERMISSION:", perm);

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      console.log("🆔 PROJECT ID:", projectId);

      if (!projectId) {
        console.log("❌ PROJECT ID MISSING");
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log("🎯 EXPO PUSH TOKEN:", token.data);

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    }

    testPush();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
