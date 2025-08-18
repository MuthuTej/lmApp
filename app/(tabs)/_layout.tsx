import { Tabs } from 'expo-router'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabsLayout() {
  const insets = useSafeAreaInsets(); 
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E95322', // Orange for active tab
        tabBarInactiveTintColor: '#9ca3af', // Gray for inactive
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 7,
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="fast-food" color={color} size={30} />,
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <Ionicons name="cart" color={color} size={30} />,
        }}
      />
      <Tabs.Screen
        name="reorder"
        options={{
          title: 'Reorder',
          tabBarIcon: ({ color }) => <Ionicons name="repeat" color={color} size={30} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" color={color} size={30} />,
        }}
      />
    </Tabs>
  )
}
