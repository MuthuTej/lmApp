import { View, TextInput, TouchableOpacity, Text, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { gql, useMutation } from "@apollo/client";

const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

export default function ResetPassword() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const resetToken = Array.isArray(token) ? token[0] : token;
  const [password, setPassword] = useState("");

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD, {
    onCompleted: () => {
      Alert.alert("Password reset successful");
      router.replace("/sign-in");
    },
    onError: (err) => Alert.alert(err.message)
  });
  if (!resetToken) {
  Alert.alert("Invalid or expired reset link");
  return null;
}


  return (
    <View style={{ padding: 20, flex: 1, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, marginBottom: 20, textAlign: "center" }}>
        Reset Password
      </Text>

      <TextInput
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 10,
          marginBottom: 12
        }}
      />

      <TouchableOpacity
        onPress={() => resetPassword({ variables: { token, newPassword: password } })}
        style={{ backgroundColor: "#FB923C", padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
          {loading ? "Resetting..." : "Reset Password"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
