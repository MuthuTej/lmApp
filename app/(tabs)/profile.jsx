import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import client from "../../apolloClient";
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
      department
      batch
    }
  }
`;

const EDIT_PROFILE = gql`
  mutation EditProfile(
    $userId: String!, 
    $name: String, 
    $email: String, 
    $mobileNumber: String, 
    $registerNumber: String,
    $batch: String
    $department: String
  ) {
    editProfile(
      userId: $userId, 
      name: $name, 
      email: $email, 
      mobileNumber: $mobileNumber, 
      registerNumber: $registerNumber,
      batch: $batch,
      department: $department
    ) {
      id
      name
      email
      mobileNumber
      registerNumber
      batch
      department
    }
  }
`;

export default function Profile() {
  const router = useRouter();
  const { data: meData, loading: meLoading, error: meError } = useQuery(GET_ME);
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
  const [editBatch, setEditBatch] = React.useState("");
  const [editDepartment, setEditDepartment] = React.useState("");
  const user = meData?.me || {};
  const userId = user.id || null;
  const userName = user.name || "Guest User";
  const userEmail = user.email || "No email available";
  const userMobile = user.mobileNumber || "Not provided";
  const userRegister = user.registerNumber || "Not provided";
  const userDepartment = user.department || "Not provided";
  const userBatch = user.batch || "Not provided";
  React.useEffect(() => {
    if (user.id) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditMobile(user.mobileNumber || "");
      setEditRegister(user.registerNumber || "");
      setEditBatch(user.batch || "");
      setEditDepartment(user.department || "");
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
        batch: editBatch,
        department: editDepartment,
      },
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userId");
    await client.clearStore();
    router.replace("/sign-in");
  };

  if (meLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#f66c3a" />
      </SafeAreaView>
    );
  }

  if (meError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white p-6">
        <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
        <Text className="text-xl font-outfit-bold text-gray-900 mt-4 text-center">Failed to load profile</Text>
        <Text className="text-gray-500 text-center mt-2 mb-6">Error: {meError.message}</Text>
        <TouchableOpacity
          onPress={() => router.replace("/sign-in")}
          className="bg-orange-500 px-8 py-3 rounded-full shadow-lg"
        >
          <Text className="text-white font-outfit-bold">Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header Background */}
        <View className="bg-orange-500 h-[220px] rounded-b-[50px] items-center justify-center shadow-lg relative z-10">
          <Text className="text-white font-outfit-bold text-3xl tracking-widest uppercase mt-4">MY PROFILE</Text>
          <Text className="text-orange-100 font-outfit-medium text-sm opacity-80">Personal Information</Text>
        </View>

        {/* Floating Avatar Section */}
        <View className="items-center -mt-16 z-20 mb-6">
          <View className="relative shadow-2xl shadow-black/30">
            <View className="bg-white p-1.5 rounded-full">
              <Image
                source={require("../../assets/profile.png")}
                className="w-32 h-32 rounded-full bg-gray-200"
                resizeMode="cover"
              />
            </View>
            <View className="absolute bottom-2 right-2 bg-green-500 w-7 h-7 rounded-full border-[3px] border-white shadow-sm" />
          </View>

          <View className="mt-4 items-center px-6">
            {isEditing ? (
              <TextInput
                value={editName}
                onChangeText={setEditName}
                className="text-2xl font-outfit-bold text-gray-800 text-center border-b-2 border-orange-500 min-w-[200px]"
                placeholder="Full Name"
              />
            ) : (
              <Text className="text-3xl font-outfit-extrabold text-gray-900 text-center tracking-tight">{userName}</Text>
            )}

            {isEditing ? (
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                className="text-base text-gray-500 font-outfit-medium mt-1 text-center border-b border-gray-300 min-w-[200px]"
                placeholder="Email Address"
              />
            ) : (
              <Text className="text-base text-gray-500 font-outfit-medium mt-1">{userEmail}</Text>
            )}
          </View>
        </View>

        {/* Info Cards */}
        <View className="px-6 space-y-4">

          {/* Card Item Helper */}
          {[
            { label: "Register Number", value: userRegister, icon: "id-card-outline" },
            { label: "Mobile Number", value: userMobile, icon: "call-outline" },
            { label: "Batch", value: userBatch, icon: "calendar-outline" },
            { label: "Department", value: userDepartment, icon: "business-outline" },
          ].map((item, index) => (
            <View key={index} className="bg-white p-4 rounded-3xl flex-row items-center border border-gray-100 shadow-sm mb-4">
              <View className="bg-orange-50 p-2 rounded-xl">
                <Ionicons name={item.icon} size={22} color="#f66c3a" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs text-gray-400 font-outfit-bold uppercase tracking-wider">{item.label}</Text>
                {isEditing && (index === 0 ? true : index === 1 ? true : index === 2 ? true : true) ? (
                  <TextInput
                    value={index === 0 ? editRegister : index === 1 ? editMobile : index === 2 ? editBatch : editDepartment}
                    onChangeText={index === 0 ? setEditRegister : index === 1 ? setEditMobile : index === 2 ? setEditBatch : setEditDepartment}
                    keyboardType={index === 1 ? "phone-pad" : "default"}
                    className="text-lg font-outfit-bold text-gray-900 border-b border-orange-100 p-0 mt-1"
                  />
                ) : (
                  <Text className="text-lg font-outfit-bold text-gray-900 mt-0.5">{item.value}</Text>
                )}
              </View>
            </View>
          ))}

        </View>

        {/* Action Buttons */}
        <View className="px-5 mt-8 space-y-3">
          {isEditing ? (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="flex-1 py-4 bg-gray-200 rounded-xl items-center justify-center"
              >
                <Text className="text-gray-600 font-outfit-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateProfile}
                className="flex-1 py-4 bg-black rounded-xl items-center justify-center shadow-md"
              >
                <Text className="text-white font-outfit-bold">Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="w-full py-4 bg-black rounded-xl flex-row items-center justify-center shadow-lg shadow-gray-300"
              >
                <Ionicons name="create-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-outfit-bold text-base">Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                className="w-full py-4 bg-white border border-gray-200 rounded-xl flex-row items-center justify-center"
              >
                <Text className="text-red-500 font-outfit-bold text-base">Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
