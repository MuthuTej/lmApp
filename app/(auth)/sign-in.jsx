import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useMutation, gql } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const SIGN_IN = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      userId
    }
  }
`;

export default function SignIn({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const [signIn, { loading, error }] = useMutation(SIGN_IN, {
    onCompleted: async (data) => {
      await AsyncStorage.setItem('token', data.signIn.token);
      router.replace('/home');
    },
  });

  return (
    <LinearGradient
      colors={['#FFE5B4', '#FFDAB9']}
      className="flex-1 justify-center px-6"
    >
      <View className="bg-white rounded-2xl shadow-lg p-6">
        <Text className="text-2xl font-bold text-center text-orange-500 mb-4">
          Welcome Back
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-orange-300 rounded-lg px-4 py-2 mb-4"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="border border-orange-300 rounded-lg px-4 py-2 mb-4"
        />

        {error && (
          <Text className="text-red-500 text-center mb-3">
            {error.message}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => signIn({ variables: { email, password } })}
          className="bg-orange-400 rounded-lg py-3 mb-3"
        >
          <Text className="text-white text-center font-bold text-lg">
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
onPress={() => navigation.navigate('SignUp')}
className="py-2"
        >
          <Text className="text-orange-500 text-center font-semibold">
            Don’t have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
