import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotifications() {
  console.log("🚀 registerForPushNotifications CALLED");

  if (!Device.isDevice) {
    console.log("❌ NOT a physical device");
    return null;
  }

  console.log("✅ Physical device confirmed");

  const perm = await Notifications.getPermissionsAsync();
  console.log("🔐 Existing permission:", perm);

  let finalStatus = perm.status;

  if (finalStatus !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    finalStatus = req.status;
    console.log("🔔 Permission requested:", req);
  }

  if (finalStatus !== "granted") {
    console.log("❌ Permission denied");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  console.log("🆔 EAS projectId:", projectId);

  if (!projectId) {
    console.log("❌ projectId is MISSING");
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  console.log("🎯 EXPO PUSH TOKEN:", token.data);

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token.data;
}
