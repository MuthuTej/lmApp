import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert } from "react-native";
import { gql, useMutation } from "@apollo/client";
import { useRouter } from "expo-router";

const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD, {
  onCompleted: (data) => {
    if (data.forgotPassword) {
      Alert.alert("Mail sent");
      router.replace("/sign-in"); // redirect after mail sent
    } else {
      Alert.alert("Email not registered");
    }
  },
  onError: (err) => Alert.alert(err.message),
});

  return (
    <View style={{ padding: 20, flex: 1, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, marginBottom: 20, textAlign: "center" }}>
        Forgot Password
      </Text>

      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 10,
          marginBottom: 12
        }}
      />

      <TouchableOpacity
        onPress={() => forgotPassword({ variables: { email } })}
        style={{ backgroundColor: "#FB923C", padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
