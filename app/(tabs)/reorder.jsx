import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { gql, useQuery, useMutation, useSubscription } from "@apollo/client"

// -------------------- QUERIES --------------------

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

// -------------------- SUBSCRIPTION --------------------

// -------------------- SUBSCRIPTION --------------------

const ORDER_STATUS_SUBSCRIPTION = gql`
  subscription OrderStatusUpdated($userId: String!) {
    orderStatusUpdated(userId: $userId) {
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
`

// -------------------- MUTATION --------------------

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
        name
      }
    }
  }
`

// ==================== COMPONENT ====================

const Reorder = () => {
  // Fetch user
  const { data: meData, loading: meLoading, error: meError } = useQuery(ME)
  const userId = meData?.me?.id

  // Fetch orders
  const {
    data,
    loading,
    error,
    subscribeToMore,
  } = useQuery(GET_ORDERS, {
    variables: { userId },
    skip: !userId,
  })

  // 🔴 Smart Subscription Handling
  React.useEffect(() => {
    if (!subscribeToMore || !userId) return;

    const unsubscribe = subscribeToMore({
      document: ORDER_STATUS_SUBSCRIPTION,
      variables: { userId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        const newOrder = subscriptionData.data.orderStatusUpdated;
        const currentTracking = prev.lastOrder.trackingOrders || [];
        const currentPast = prev.lastOrder.pastOrders || [];

        // Check if order exists in lists
        const isTracking = currentTracking.some(o => o.orderId === newOrder.orderId);
        const isPast = currentPast.some(o => o.orderId === newOrder.orderId);

        // Logic: Is this order completed/delivered?
        const isCompleted = ["delivered", "completed", "cancelled"].includes(newOrder.status.toLowerCase());

        let newTracking = [...currentTracking];
        let newPast = [...currentPast];

        if (isCompleted) {
          // If it was tracking, remove it
          if (isTracking) {
            newTracking = newTracking.filter(o => o.orderId !== newOrder.orderId);
          }
          // Add to past if not already there (or update it)
          if (isPast) {
            newPast = newPast.map(o => o.orderId === newOrder.orderId ? newOrder : o);
          } else {
            newPast = [newOrder, ...newPast];
          }
        } else {
          // It is still active/tracking
          if (isTracking) {
            newTracking = newTracking.map(o => o.orderId === newOrder.orderId ? newOrder : o);
          } else {
            // It's a new active order!
            newTracking = [newOrder, ...newTracking];
            // If it was in past for some reason (re-opened?), remove it
            if (isPast) newPast = newPast.filter(o => o.orderId !== newOrder.orderId);
          }
        }

        return {
          ...prev,
          lastOrder: {
            ...prev.lastOrder,
            trackingOrders: newTracking,
            pastOrders: newPast,
          },
        };
      },
    });

    return () => unsubscribe();
  }, [subscribeToMore, userId]);

  // Mutation
  const [reorder] = useMutation(REORDER_MUTATION)

  // Loading & error states
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

  // -------------------- REORDER --------------------

  const handleReorder = async () => {
    try {
      const res = await reorder({ variables: { userId } })
      const result = res.data.reorder

      if (result.status === "ALL_AVAILABLE") {
        Alert.alert("Reorder added", "Items have been added to your cart")
        return
      }

      if (result.status === "NO_ITEMS_AVAILABLE") {
        Alert.alert(
          "Items unavailable",
          "None of the items from your last order are currently available."
        )
        return
      }

      if (result.status === "PARTIAL_AVAILABLE") {
        const unavailableNames = result.unavailableItems
          .map(i => i.dishName)
          .join(", ")

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
                    forceAdd: true,
                  },
                })

                Alert.alert(
                  "Reorder updated",
                  "Available items have been added to your cart"
                )
              },
            },
          ]
        )
      }
    } catch (err) {
      console.error("Reorder failed:", err)
      Alert.alert("Error", "Failed to reorder. Please try again.")
    }
  }

  // -------------------- UI HELPERS --------------------

  const getProgress = (status) => {
    switch (status) {
      case "paid": return 25
      case "done": return 75
      case "delivered": return 100
      default: return 0
    }
  }

  const renderOrderCard = (order, isPast = false) => {
    const progress = getProgress(order.status)

    return (
      <View
        key={order.orderId}
        className="flex-row bg-gray-50 rounded-2xl p-4 mb-4 items-center shadow-lg border border-gray-200"
      >
        <Image
          source={{ uri: order.items[0]?.imageUrl }}
          className="w-20 h-20 rounded-xl"
          resizeMode="cover"
        />

        <View className="flex-1 ml-4">
          <Text className="text-base font-semibold text-gray-800">
            {order.items[0]?.dishName}
          </Text>

          <Text className="text-xs text-gray-500">
            {new Date(Number(order.createdAt)).toLocaleString()}
          </Text>

          <Text className="text-sm text-red-500 font-semibold">
            ₹{order.total}
          </Text>

          {!isPast && (
            <View className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <View
                className="h-2 bg-orange-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          )}

          {isPast && (
            <TouchableOpacity
              onPress={handleReorder}
              className="bg-orange-500 px-4 py-2 mt-2 rounded-full self-start"
            >
              <Text className="text-white font-semibold text-xs">
                Reorder
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  // -------------------- UI --------------------

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="mb-4">
          <Text className="text-xl font-bold text-gray-800">
            Tracking Orders
          </Text>
        </View>

        {trackingOrders.length > 0
          ? trackingOrders.map(order => renderOrderCard(order, false))
          : <Text className="text-gray-500">No active tracking orders.</Text>}

        <View className="mb-4 mt-6">
          <Text className="text-xl font-bold text-gray-800">
            Past Orders
          </Text>
        </View>

        {pastOrders.length > 0
          ? pastOrders.map(order => renderOrderCard(order, true))
          : <Text className="text-gray-500">No past orders.</Text>}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Reorder
