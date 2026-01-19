import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function VegIndicator({ isVeg, size = "sm" }) {
  if (isVeg === undefined || isVeg === null) return null;

  const sizeMap = {
    xs: { container: "px-1.5 py-0.5", text: "text-[8px]", icon: 10 },
    sm: { container: "px-2 py-1", text: "text-[10px]", icon: 12 },
    md: { container: "px-3 py-1.5", text: "text-xs", icon: 14 },
    lg: { container: "px-4 py-2", text: "text-sm", icon: 16 },
  };

  const config = sizeMap[size] || sizeMap.sm;
  const isVegStatus = isVeg === true || isVeg === "true";

  if (isVegStatus) {
    return (
      <View className={`self-start flex-row items-center ${config.container} rounded-lg bg-green-50 border border-green-200`}>
        <View className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1" />
        <Text className={`${config.text} font-outfit-bold text-green-700`}>VEG</Text>
      </View>
    );
  } else {
    return (
      <View className={`self-start flex-row items-center ${config.container} rounded-lg bg-red-50 border border-red-200`}>
        <View className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1" />
        <Text className={`${config.text} font-outfit-bold text-red-700`}>NON-VEG</Text>
      </View>
    );
  }
}
