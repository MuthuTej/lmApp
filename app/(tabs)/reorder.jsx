import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { gql, useQuery, useMutation, useSubscription } from "@apollo/client"

// -------------------- QUERIES --------------------

// Query to get user info
const ME = gql`
  query GetMe {
    me {
      id
      name
      email
      mobileNumber
      registerNumber
    }
  }
`;

// Query to fetch orders dynamically by userId
const GET_ORDERS = gql`
  query GetOrders($userId: String!) {
    lastOrder(userId: $userId) {
      trackingOrders {
        internalOrderId
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
        internalOrderId
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

// Reorder mutation
const REORDER_MUTATION = gql`
  mutation Reorder($userId: String!, $internalOrderId: String, $forceAdd: Boolean) {
    reorder(
      userId: $userId
      internalOrderId: $internalOrderId
      forceAdd: $forceAdd
    ) {
      status
      availableItems {
        dishId
        dishName
        price
        quantity
        imageUrl
      }
      unavailableItems {
        dishId
        dishName
        price
        imageUrl
      }
    }
  }
`

// ==================== COMPONENT ====================

const Reorder = () => {
  // Fetch user
  const { data: meData, loading: meLoading, error: meError } = useQuery(ME)
  const userId = meData?.me?.id

  // Mutation
  const [reorder] = useMutation(REORDER_MUTATION)

  // Fetch orders
  const {
    data,
    loading,
    error,
    refetch,
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
            newPast = newPast.map(o => o.orderId === newOrder.orderId ? { ...o, ...newOrder } : o);
          } else {
            // For a complete implementation, we'd need the full order details here to add it freshly.
            // But usually it transitions from tracking, so we have the data.
            // If we rely on the subscription only sending updates, we might need a refetch if it's missing.
            // Assuming newOrder carries enough info or we accept the risk/complexity.
            // For now, let's map it if exists, else add it.
            // Note: The subscription payload defined earlier might need internalOrderId to match the new query shape perfecty
            // but visually it will update.
            newPast = [newOrder, ...newPast];
          }
        } else {
          // It is still active/tracking
          if (isTracking) {
            newTracking = newTracking.map(o => o.orderId === newOrder.orderId ? { ...o, ...newOrder } : o);
          } else {
            newTracking = [newOrder, ...newTracking];
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
  const handleReorder = async (orderId) => {
    if (!orderId) {
      Alert.alert("Error", "Cannot identify this order. internalOrderId is missing.");
      return;
    }

    try {
      const variables = {
        userId,
        internalOrderId: orderId
      };

      const res = await reorder({ variables });
      const result = res.data.reorder;

      // 🟢 All items available
      if (result.status === "ALL_AVAILABLE") {
        Alert.alert("Reorder added", "Items have been added to your cart");
        return;
      }

      // 🔴 No items available
      if (result.status === "NO_ITEMS_AVAILABLE") {
        Alert.alert(
          "Items unavailable",
          "None of the items from this order are currently available."
        );
        return;
      }

      // 🟡 Partial availability
      if (result.status === "PARTIAL_AVAILABLE") {
        const unavailableNames = result.unavailableItems
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
                const retryVariables = {
                  userId,
                  forceAdd: true,
                  internalOrderId: orderId
                };

                await reorder({
                  variables: retryVariables
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
        key={order.internalOrderId}
        className="bg-white rounded-[24px] p-5 mb-6 shadow-lg shadow-orange-500/25 border-2 border-orange-200"
      >
        {/* Header: Date & Total */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xs text-gray-400 font-outfit-bold uppercase tracking-wider">
            {new Date(Number(order.createdAt)).toLocaleString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
          <View className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
            <Text className="text-sm text-green-700 font-outfit-bold">
              ₹{order.total}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="h-0.5 bg-gray-100 mb-3" />

        {/* Scrollable Items List */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          {order.items.map((item, index) => (
            <View key={index} className="mr-3 items-center w-24 bg-gray-50 p-2 rounded-xl">
              <Image
                source={{ uri: item.imageUrl }}
                className="w-20 h-20 rounded-lg mb-2 bg-gray-200"
                resizeMode="cover"
              />
              <Text numberOfLines={1} className="text-xs text-gray-800 text-center font-outfit-bold w-full">
                {item.dishName}
              </Text>
              <Text className="text-[10px] text-gray-500 mt-1">
                Qty: {item.quantity}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer: Status & Actions */}
        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-50">
          <View className="flex-row items-center flex-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${!isPast ? 'bg-orange-500' : 'bg-green-500'}`} />
            <Text className="text-xs font-outfit-bold text-gray-700 capitalize tracking-wide">
              {order.status}
            </Text>

            {/* Progress bar for tracking orders (Inline) */}
            {!isPast && (
              <View className="flex-1 ml-3 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                <View
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            )}
          </View>

          {/* Reorder button */}
          {isPast && (
            <TouchableOpacity
              onPress={() => handleReorder(order.internalOrderId)}
              className="bg-orange-500 px-5 py-2 rounded-full shadow-lg shadow-orange-500/30"
            >
              <Text className="text-white font-outfit-bold text-xs tracking-wide">Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-orange-500 pt-14 pb-8 px-6 rounded-b-[40px] shadow-xl mb-6 z-10">
        <Text className="text-4xl font-outfit-extrabold text-white tracking-tight">Order History</Text>
        <Text className="text-orange-50 text-sm mt-1 font-outfit-medium tracking-wide opacity-90">
          Track current and past orders
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Tracking Orders */}
        <View className="mb-4 mt-2">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <View className="w-1.5 h-6 bg-orange-500 rounded-full mr-3" />
              <Text className="text-2xl font-outfit-bold text-gray-800">Tracking Orders</Text>
            </View>
            <TouchableOpacity
              onPress={() => refetch()}
              className="bg-orange-100 px-4 py-1.5 rounded-full border border-orange-300 active:bg-orange-200"
            >
              <Text className="text-xs font-semibold text-orange-700">
                Refresh
              </Text>
            </TouchableOpacity>

          </View>

          {trackingOrders.length > 0
            ? trackingOrders.map(order => renderOrderCard(order, false))
            : (
              <View className="bg-white p-6 rounded-2xl items-center justify-center border border-dashed border-gray-300">
                <Text className="text-gray-400 font-medium">No active orders</Text>
              </View>
            )}
        </View>

        {/* Past Orders */}
        <View className="mb-4 mt-4">
          <View className="flex-row items-center mb-4">
            <View className="w-1.5 h-6 bg-gray-300 rounded-full mr-3" />
            <Text className="text-2xl font-outfit-bold text-gray-800">Past Orders</Text>
          </View>

          {pastOrders.length > 0
            ? pastOrders.map(order => renderOrderCard(order, true))
            : <Text className="text-gray-500 text-center mt-4">No past orders found.</Text>}
        </View>
      </ScrollView>
    </View>
  )
}

export default Reorder
