import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { useMutation, gql } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const SIGN_UP = gql`
  mutation SignUp($email: String!, $password: String!) {
    signUp(email: $email, password: $password) {
      token
      userId
    }
  }
`;

export default function SignUp({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [signUp, { loading, error }] = useMutation(SIGN_UP, {
    onCompleted: async (data) => {
      await AsyncStorage.setItem('token', data.signUp.token);
      navigation.navigate('SignIn');
    },
  });

  const handleSignUp = () => {
    if (!email.endsWith('@citchennai.net')) {
      Alert.alert('Invalid Email', 'Please use your @citchennai.net email address.');
      return;
    }
    signUp({ variables: { email, password } });
  };

  return (
    <LinearGradient
      colors={['#FFE5B4', '#FFDAB9']} // pale orange gradient
      className="flex-1 justify-center px-6"
    >
      <View className="bg-white rounded-2xl shadow-lg p-6">
        <Text className="text-2xl font-bold text-center text-orange-500 mb-4">
          Create Account
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
          onPress={handleSignUp}
          className="bg-orange-400 rounded-lg py-3 mb-3"
        >
          <Text className="text-white text-center font-bold text-lg">
            {loading ? 'Creating...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignIn')}
          className="py-2"
        >
          <Text className="text-orange-500 text-center font-semibold">
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
