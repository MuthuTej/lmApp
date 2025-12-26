import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, gql } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

// 🔔 Push notifications
import { registerForPushNotifications } from "../../utils/notifications";

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
  const router = useRouter();

  const [signIn, { loading, error }] = useMutation(SIGN_IN, {
    onCompleted: async (data) => {
      try {
        // 1️⃣ Save auth token
        await AsyncStorage.setItem("token", data.signIn.token);

        // 2️⃣ Register push notifications (OPTION 1)
        const pushToken = await registerForPushNotifications();
        console.log("🔥 EXPO PUSH TOKEN AFTER LOGIN:", pushToken);

        // 3️⃣ (Optional) Send token to backend
        if (pushToken) {
          await fetch("https://your-backend.com/save-push-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.signIn.userId,
              expoPushToken: pushToken,
            }),
          });
        }

        // 4️⃣ Navigate into tabs (CRITICAL)
        router.replace("/(tabs)/home");
      } catch (err) {
        console.error("Login flow error:", err);
      }
    },
  });

  return (
    <LinearGradient colors={["#FFE5B4", "#FFDAB9"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingHorizontal: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 20,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  textAlign: "center",
                  color: "#F97316",
                  marginBottom: 16,
                }}
              >
                Welcome Back
              </Text>

              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  borderWidth: 1,
                  borderColor: "#FDBA74",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 12,
                }}
              />

              <TextInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{
                  borderWidth: 1,
                  borderColor: "#FDBA74",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 12,
                }}
              />

              {error && (
                <Text
                  style={{
                    color: "red",
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  {error.message}
                </Text>
              )}

              <TouchableOpacity
                onPress={() =>
                  signIn({ variables: { email, password } })
                }
                style={{
                  backgroundColor: "#FB923C",
                  borderRadius: 10,
                  paddingVertical: 14,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: 18,
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/sign-up")}
              >
                <Text
                  style={{
                    color: "#F97316",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Don’t have an account? Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
