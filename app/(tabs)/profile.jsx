import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { gql, useQuery, useMutation } from "@apollo/client";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      mobileNumber
      registerNumber
    }
  }
`;

const EDIT_PROFILE = gql`
  mutation EditProfile(
    $userId: String!, 
    $name: String, 
    $email: String, 
    $mobileNumber: String, 
    $registerNumber: String
  ) {
    editProfile(
      userId: $userId, 
      name: $name, 
      email: $email, 
      mobileNumber: $mobileNumber, 
      registerNumber: $registerNumber
    ) {
      id
      name
      email
      mobileNumber
      registerNumber
    }
  }
`;

export default function Profile() {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery(GET_ME);
  const [editProfileMutation] = useMutation(EDIT_PROFILE, {
    onCompleted: () => {
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    },
    refetchQueries: [{ query: GET_ME }],
  });

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editMobile, setEditMobile] = React.useState("");
  const [editRegister, setEditRegister] = React.useState("");

  const user = meData?.me || {};
  const userId = user.id || null;
  const userName = user.name || "Guest User";
  const userEmail = user.email || "No email available";
  const userMobile = user.mobileNumber || "Not provided";
  const userRegister = user.registerNumber || "Not provided";

  React.useEffect(() => {
    if (user.id) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditMobile(user.mobileNumber || "");
      setEditRegister(user.registerNumber || "");
    }
  }, [user]);

  const handleUpdateProfile = () => {
    if (!userId) return;
    editProfileMutation({
      variables: {
        userId,
        name: editName,
        email: editEmail,
        mobileNumber: editMobile,
        registerNumber: editRegister,
      },
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-orange-500 pt-12 pb-8 px-6 rounded-b-[32px] shadow-lg mb-6">
        <View className="flex-row justify-between items-center">
          <Text className="text-3xl font-bold text-white tracking-tight">Student Profile</Text>
          <TouchableOpacity className="bg-white/20 p-2 rounded-full">
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-orange-100 text-sm mt-1 font-medium opacity-90">
          Manage your account details
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Profile Card */}
        <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 items-center mb-6">
          {/* Profile Image */}
          <View className="relative">
            <Image
              source={require("../../assets/profile.jpeg")}
              className="w-32 h-32 rounded-full border-4 border-gray-50 mb-4 bg-gray-100"
              resizeMode="cover"
            />
            <View className="absolute bottom-4 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white" />
          </View>

          {/* User Info */}
          {isEditing ? (
            <View className="w-full">
              <TextInput
                value={editName}
                onChangeText={setEditName}
                className="text-2xl font-bold text-gray-900 text-center bg-gray-50 rounded-xl p-2 mb-2"
                placeholder="Full Name"
              />
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                className="text-sm text-gray-500 font-medium mb-6 text-center bg-gray-50 rounded-xl p-1"
                placeholder="Email Address"
              />
            </View>
          ) : (
            <>
              <Text className="text-2xl font-bold text-gray-900 text-center">{userName}</Text>
              <Text className="text-sm text-gray-500 font-medium mb-6">{userEmail}</Text>
            </>
          )}

          <View className="w-full bg-gray-50 rounded-2xl p-4 mb-2">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-500 font-medium">Register No</Text>
              {isEditing ? (
                <TextInput
                  value={editRegister}
                  onChangeText={setEditRegister}
                  className="text-gray-900 font-bold bg-white px-2 py-1 rounded-lg border border-gray-200"
                  placeholder="Register Number"
                />
              ) : (
                <Text className="text-gray-900 font-bold">{userRegister}</Text>
              )}
            </View>
            <View className="h-[1px] bg-gray-200 mb-3" />
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-500 font-medium">Mobile</Text>
              {isEditing ? (
                <TextInput
                  value={editMobile}
                  onChangeText={setEditMobile}
                  keyboardType="phone-pad"
                  className="text-gray-900 font-bold bg-white px-2 py-1 rounded-lg border border-gray-200"
                  placeholder="Mobile Number"
                />
              ) : (
                <Text className="text-gray-900 font-bold">{userMobile}</Text>
              )}
            </View>
            <View className="h-[1px] bg-gray-200 mb-3" />
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-500 font-medium">Batch</Text>
              <Text className="text-gray-900 font-bold">2021 - 2025</Text>
            </View>
            <View className="h-[1px] bg-gray-200 mb-3" />
            <View className="flex-row justify-between items-start">
              <Text className="text-gray-500 font-medium">Department</Text>
              <Text className="text-gray-900 font-bold text-right w-40">Computer Science & Engineering</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View className="mb-10">
          {isEditing ? (
            <>
              <TouchableOpacity
                onPress={handleUpdateProfile}
                className="bg-green-500 py-4 rounded-2xl shadow-lg shadow-green-200 mb-4 flex-row justify-center items-center"
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-lg">Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="bg-white py-4 rounded-2xl border border-gray-200 flex-row justify-center items-center"
              >
                <Ionicons name="close-circle-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                <Text className="text-gray-500 font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="bg-orange-500 py-4 rounded-2xl shadow-lg shadow-orange-200 mb-4 flex-row justify-center items-center"
              >
                <Ionicons name="create-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-lg">Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                className="bg-white py-4 rounded-2xl border border-gray-200 flex-row justify-center items-center"
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                <Text className="text-red-500 font-bold text-lg">Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
