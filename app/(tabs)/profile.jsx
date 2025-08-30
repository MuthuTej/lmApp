import React from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { gql, useQuery } from "@apollo/client";
import { LinearGradient } from "expo-linear-gradient";

const ME = gql`
  query {
    me {
      id
      email
      name
    }
  }
`;

export default function Profile() {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery(ME);

  const userId = meData?.me?.id || null;
  const userName = meData?.me?.name || "Guest User";
  const userEmail = meData?.me?.email || "No email available";

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/sign-in");
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#f97316", "#fb923c"]}
        className="h-48 justify-end rounded-b-3xl shadow-md"
      >
        <View className="p-5">
          <Text className="text-white text-2xl font-extrabold">
            Student Profile
          </Text>
        </View>
      </LinearGradient>

      {/* Profile Card */}
      <View className="m-5 p-6 bg-white rounded-3xl shadow-lg items-center -mt-20 border border-gray-100">
        {/* Profile Image */}
        <Image
          source={require("../../assets/profile.jpeg")}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 4,
            borderColor: "#fff",
            backgroundColor: "#f3f4f6",
          }}
          resizeMode="cover"
        />

        {/* User Info */}
        <Text className="text-xl font-bold text-gray-800 mt-4">{userName}</Text>
        <Text className="text-sm text-gray-500 mt-1">{userEmail}</Text>
        <Text className="text-sm text-gray-600 mt-2">
          Register No: <Text className="font-semibold">24CS0777</Text>
        </Text>
        <Text className="text-sm text-gray-600 mt-1">
          Batch: <Text className="font-semibold">2021 - 2025</Text>
        </Text>
        <Text className="text-sm text-gray-600 mt-1">
          Department:{" "}
          <Text className="font-semibold">
            Computer Science & Engineering
          </Text>
        </Text>

        {/* Buttons */}
        <View className="flex-row gap-4 mt-6">
          <TouchableOpacity className="bg-orange-500 py-3 px-6 rounded-2xl shadow-md">
            <Text className="text-white font-semibold">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-gray-200 py-3 px-6 rounded-2xl shadow-md"
          >
            <Text className="text-gray-700 font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
