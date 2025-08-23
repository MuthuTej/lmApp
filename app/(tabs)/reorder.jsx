import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const orders = [
  {
    id: 1,
    name: 'Panner Pizza',
    date: 'July 1 - 8:32 am',
    price: '₹100',
    image: require("../../assets/pizza.png")
  },
  {
    id: 2,
    name: 'Pasta',
    date: 'June 25 - 10:01 pm',
    price: '₹120',
    image: require("../../assets/pasta.png")
  },
  {
    id: 3,
    name: 'Milkashake',
    date: 'June 25 - 7:44 am',
    price: '₹110',
    image: require("../../assets/milkshake.png")
  },
]

const Reorder = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-4">
          <Text className="text-xl font-bold text-gray-800">Order History</Text>
        </View>

        {/* Orders List */}
        {orders.map(order => (
          <View 
  key={order.id} 
  className="flex-row bg-gray-50 rounded-2xl p-4 mb-4 items-center shadow-lg border border-gray-200"
>
            {/* Image */}
            <Image 
  source={order.image}
  className="w-20 h-20 rounded-xl"
  resizeMode="contain" // or "cover" depending on how you want it to look
/>
   
            {/* Info */}
            <View className="flex-1 ml-4">
              <Text className="text-base font-semibold text-gray-800">{order.name}</Text>
              <Text className="text-xs text-gray-500">{order.date}</Text>
              <Text className="text-sm text-red-500 font-semibold">Paid - {order.price}</Text>
              {/* Reorder Button */}
              <TouchableOpacity className="bg-orange-500 px-4 py-2 mt-2 rounded-full self-start">
                <Text className="text-white font-semibold text-xs">Reorder</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Reorder
