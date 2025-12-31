import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ImageBackground,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, gql } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import client from "../../apolloClient";
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const SIGN_IN = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      userId
    }
  }
`;

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loginError, setLoginError] = useState(null);

  const [signIn, { loading, error }] = useMutation(SIGN_IN, {
    onCompleted: async (data) => {
      await AsyncStorage.setItem("token", data.signIn.token);
      await AsyncStorage.setItem("userId", data.signIn.userId);
      await client.clearStore();
      router.replace("/home");
    },
    onError: (err) => {
      if (err.message.includes("Invalid credentials")) {
        setLoginError(true); // show forgot password
      } else {
        setLoginError(false); // other errors
      }
    },

  });


  return (
    <View className="flex-1 bg-white">
      <ImageBackground
        source={require('../../assets/logbg2.jpg')}
        className="flex-1 justify-end"
        resizeMode="cover"
        imageStyle={{ top: -10 }}
      >
        <View className="absolute inset-0 bg-black/40" />

        {/* Back Button */}
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 z-50 flex-row items-center"
          style={{ top: insets.top + 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
          <Text className="text-white font-semibold text-lg ml-1">Back</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1" />
            {/* White Container */}
            <View
              className="bg-white/90 rounded-t-3xl p-8 pt-10 backdrop-blur-sm"
              style={{ paddingBottom: insets.bottom + 20 }}
            >

              <Text className="text-4xl font-black text-center text-neutral-900 mb-1 tracking-tight">
                Welcome Back!
              </Text>
              <Text className="text-lg text-center text-neutral-500 mb-8 font-light tracking-wide italic">
                Welcome back! Let's cook up something amazing again
              </Text>

              {/* Email Input */}
              <View className="mb-4">
                <TextInput
                  placeholder="Enter Your Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"

                  className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-4 text-gray-800"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Password Input */}
              <View className="mb-4 relative">
                <TextInput
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}

                  className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-4 text-gray-800 pr-12"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowPassword(!showPassword)}

                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="gray" />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between items-center mb-6">
                {/* Dummy Checkbox */}
                <TouchableOpacity className="flex-row items-center">
                  <View className="w-5 h-5 border border-orange-300 rounded mr-2" />
                  <Text className="text-gray-500 text-sm">Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text className="text-gray-500 text-sm">Forgot Password</Text>
                </TouchableOpacity>
              </View>

              {error && (
                <Text className="text-red-500 text-center mb-4">
                  {error.message}
                </Text>
              )}
              {loginError && (
                <TouchableOpacity
                  onPress={() => router.push("/forgot-password")} // navigate to ForgotPassword screen
                  style={{ marginBottom: 12 }}
                >
                  <Text
                    style={{
                      color: "#F97316",
                      textAlign: "center",
                      fontWeight: "600",
                      textDecorationLine: "underline",
                    }}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}
              {/* Sign In Button */}
              <TouchableOpacity // Sign In Action
                onPress={() => signIn({ variables: { email, password } })}
                className="bg-[#f66c3a] rounded-full py-4 mb-8 shadow-md items-center justify-center"
              >
                <Text className="text-white font-bold text-lg">
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              {/* Toggle */}
              <View className="flex-row justify-center pb-8">
                <Text className="text-gray-500">Don't Have Account </Text>
                <TouchableOpacity onPress={() => router.push("/sign-up")}>
                  <Text className="font-bold text-gray-900">Sign Up</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}
