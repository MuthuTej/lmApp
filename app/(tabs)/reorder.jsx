import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { gql, useQuery, useMutation } from "@apollo/client"

// Query to get user info
const ME = gql`
  query {
    me {
      id
      email
      name
    }
  }
`

// Query to fetch orders dynamically by userId
const GET_ORDERS = gql`
  query GetOrders($userId: String!) {
    lastOrder(userId: $userId) {
      trackingOrders {
        orderId
        items {
          dishName
          price
          quantity
          imageUrl
        }
        total
        createdAt
        status
      }
      pastOrders {
        orderId
        items {
          dishName
          price
          quantity
          imageUrl
        }
        total
        createdAt
        status
      }
    }
  }
`

// Reorder mutation
const REORDER_MUTATION = gql`
  mutation Reorder($userId: String!, $forceAdd: Boolean) {
    reorder(userId: $userId, forceAdd: $forceAdd) {
      status
      availableItems {
        dishName
        price
        quantity
        imageUrl
      }
      unavailableItems {
        dishName
      }
    }
  }
`

const Reorder = () => {
  // Fetch user
  const { data: meData, loading: meLoading, error: meError } = useQuery(ME)
  const userId = meData?.me?.id

  // Mutation
  const [reorder] = useMutation(REORDER_MUTATION)

  // Fetch orders (only when userId is available)
  const { data, loading, error } = useQuery(GET_ORDERS, {
    variables: { userId },
    skip: !userId,
  })

  // Handle loading & error states
  if (meLoading || loading) {
    return <Text className="p-4">Loading...</Text>
  }
  if (meError) {
    return <Text className="p-4">Error: {meError.message}</Text>
  }
  if (error) {
    return <Text className="p-4">Error: {error.message}</Text>
  }

  if (!data?.lastOrder) {
    return <Text className="p-4">No orders found.</Text>
  }

  const { trackingOrders, pastOrders } = data.lastOrder

  // Handle reorder
  const handleReorder = async () => {
    try {
      const res = await reorder({ variables: { userId } });
      const data = res.data.reorder;

      // 🟢 All items available
      if (data.status === "ALL_AVAILABLE") {
        Alert.alert("Reorder added", "Items have been added to your cart");
        return;
      }

      // 🔴 No items available
      if (data.status === "NO_ITEMS_AVAILABLE") {
        Alert.alert(
          "Items unavailable",
          "None of the items from your last order are currently available."
        );
        return;
      }

      // 🟡 Partial availability
      if (data.status === "PARTIAL_AVAILABLE") {
        const unavailableNames = data.unavailableItems
          .map(i => i.dishName)
          .join(", ");

        Alert.alert(
          "Some items unavailable",
          `Unavailable items:\n${unavailableNames}\n\nAdd remaining items to cart?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Add Available Items",
              onPress: async () => {
                await reorder({
                  variables: {
                    userId,
                    forceAdd: true
                  }
                });

                Alert.alert(
                  "Reorder updated",
                  "Available items have been added to your cart"
                );
              }
            }
          ]
        );
      }
    } catch (err) {
      console.error("Reorder failed:", err);
      Alert.alert("Error", "Failed to reorder. Please try again.");
    }
  }

  // Convert status → progress
  const getProgress = (status) => {
    switch (status) {
      case "paid": return 25
      case "done": return 75
      case "delivered": return 100
      default: return 0
    }
  }

  // Order card
  const renderOrderCard = (order, isPast = false) => {
    const progress = getProgress(order.status)

    return (
      <View
        key={order.orderId}
        className="flex-row bg-gray-50 rounded-2xl p-4 mb-4 items-center shadow-lg border border-gray-200"
      >
        {/* Image */}
        <Image
          source={{ uri: order.items[0]?.imageUrl }}
          className="w-20 h-20 rounded-xl"
          resizeMode="cover"
        />

        {/* Info */}
        <View className="flex-1 ml-4">
          <Text className="text-base font-semibold text-gray-800">{order.items[0]?.dishName}</Text>
          <Text className="text-xs text-gray-500">{new Date(Number(order.createdAt)).toLocaleString()}</Text>
          <Text className="text-sm text-red-500 font-semibold">Paid - ₹{order.total}</Text>

          {/* Progress bar for tracking orders */}
          {!isPast && (
            <View className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <View
                className="h-2 bg-orange-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          )}

          {/* Reorder button only for past orders */}
          {isPast && (
            <TouchableOpacity
              onPress={handleReorder}
              className="bg-orange-500 px-4 py-2 mt-2 rounded-full self-start"
            >
              <Text className="text-white font-semibold text-xs">Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Tracking Orders */}
        <View className="mb-4">
          <Text className="text-xl font-bold text-gray-800">Tracking Orders</Text>
        </View>

        {trackingOrders.length > 0
          ? trackingOrders.map(order => renderOrderCard(order, false))
          : <Text className="text-gray-500">No active tracking orders.</Text>}

        {/* Past Orders */}
        <View className="mb-4 mt-6">
          <Text className="text-xl font-bold text-gray-800">Past Orders</Text>
        </View>

        {pastOrders.length > 0
          ? pastOrders.map(order => renderOrderCard(order, true))
          : <Text className="text-gray-500">No past orders.</Text>}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Reorder
