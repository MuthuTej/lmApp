import React,{useState} from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Switch, ScrollView } from 'react-native';

export default function Profile() {
  const [isOpen,setIsOpen]=useState(true);

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header with Background Image */}
      <ImageBackground 
        source={require("../../assets/restaurant.jpg")} 
        className="h-44 justify-end"
        resizeMode="cover"
      >
        <View className="bg-black/50 p-4">
          <Text className="text-white text-xl font-bold">Delight Restaurant</Text>
          <Text className="text-gray-200 text-sm mt-1">Owner: John Doe</Text>
        </View>
      </ImageBackground>

      {/* Info Section */}
      <View className="m-4 p-4 bg-white rounded-2xl shadow-md border border-gray-200 shwdow-lg">
        {/* Timings */}
        <Text className="text-sm text-gray-600">Opening Time: <Text className="font-semibold text-gray-800">9:00 AM</Text></Text>
        <Text className="text-sm text-gray-600 mt-1">Closing Time: <Text className="font-semibold text-gray-800">10:00 PM</Text></Text>

        {/* Stats */}
        <View className="flex-row justify-between mt-6">
          <View className="items-center flex-1">
            <Text className="text-lg font-bold text-gray-800">120</Text>
            <Text className="text-xs text-gray-500 mt-1">Orders this Week</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-lg font-bold text-gray-800">18</Text>
            <Text className="text-xs text-gray-500 mt-1">Orders Today</Text>
          </View>
        </View>

        {/* Open/Close Toggle */}
        <View className="flex-row items-center justify-between mt-6">
          <Text className="text-sm text-gray-700">Restaurant Status:</Text>
          <View className="flex-row items-center">
            <Switch
              value={isOpen}
              onValueChange={(val)=>setIsOpen(val)}
              thumbColor={isOpen ? "#4ade80" : "#f87171"}
            />
            <Text className={`ml-2 font-semibold ${isOpen ? "text-green-500" : "text-red-500"}`}>
              {isOpen ? "Open" : "Closed"}
            </Text>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity className="mt-6 bg-orange-500 py-3 rounded-xl items-center">
          <Text className="text-white font-bold">Edit Details</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
