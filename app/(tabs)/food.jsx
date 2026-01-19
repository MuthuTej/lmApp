// CartScreen.jsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

// ------------------ GraphQL ------------------

const GET_CART = gql`
  query GetCart($userId: String!) {
    getCart(userId: $userId) {
      createdAt
      items {
        dishId
        dishName
        imageUrl
        price
        quantity
      }
      restaurantId
      status
      userName
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart(
    $userId: String!
    $restaurantId: String!
    $dishId: String!
    $dishName: String!
    $price: Float!
    $quantity: Int!
    $userName: String!
    $imageUrl: String
  ) {
    addToCart(
      userId: $userId
      restaurantId: $restaurantId
      dishId: $dishId
      dishName: $dishName
      price: $price
      quantity: $quantity
      userName: $userName
      imageUrl: $imageUrl
    )
  }
`;

const CLEAR_CART = gql`
  mutation ClearCart($userId: String!) {
    clearCart(userId: $userId)
  }
`;

const CHECKOUT_CART = gql`
  mutation CheckoutCart($userId: String!) {
    checkoutCart(userId: $userId) {
      success
      internalOrderId
      restaurantId
      total
      cashfreeOrderId
    }
  }
`;

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

// ------------------ Component ------------------

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { data: meData, loading: meLoading } = useQuery(ME);
  const userId = meData?.me?.id || null;
  const userName = meData?.me?.name || null;

  const [loadingItemId, setLoadingItemId] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { data, loading, refetch } = useQuery(GET_CART, {
    variables: { userId },
    fetchPolicy: "network-only",
    skip: !userId,
  });

  const [addToCart] = useMutation(ADD_TO_CART, {
    onCompleted: () => {
      setLoadingItemId(null);
      refetch();
    },
    onError: (err) => {
      setLoadingItemId(null);
      const errorMessage = err.message || "";

      console.log("error", err.message);

      if (errorMessage.includes("not available")) {
        alert("This item is currently unavailable.");
      } else if (errorMessage.includes("not found")) {
        alert("This item is no longer on the menu.");
      } else {
        alert(err.message);
      }
    },
  });

  const [clearCart] = useMutation(CLEAR_CART, {
    onCompleted: () => refetch(),
  });

  const [checkoutCart, { loading: checkoutLoading }] =
    useMutation(CHECKOUT_CART);

  // ✅ REFRESH CART AFTER PAYMENT SUCCESS (when coming back)
  React.useEffect(() => {
    if (params?.paymentSuccess === "true") {
      console.log("🔄 Payment success detected, refetching cart...");
      refetch().then(() => {
        console.log("✅ Cart refetched successfully");
      });

      // ✅ remove param to prevent repeated refetch
      router.setParams({ paymentSuccess: "false" });
    }
  }, [params?.paymentSuccess, refetch]);

  // ------------------ Handlers ------------------

  const handleQuantityChange = (item, change) => {
    setLoadingItemId(item.dishId);

    addToCart({
      variables: {
        userId,
        restaurantId: data?.getCart?.restaurantId || "",
        dishId: item.dishId,
        dishName: item.dishName,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: change,
        userName,
      },
    });
  };

  const handleClearAll = () => {
    if (!userId) return alert("Please login first");
    clearCart({ variables: { userId } });
  };

  const handleCheckout = async () => {
    if (!userId) return alert("Please login first");

    setIsProcessingPayment(true);

    try {
      const checkoutRes = await checkoutCart({
        variables: { userId },
      });

      const response = checkoutRes?.data?.checkoutCart;

      if (!response?.success) {
        alert("Checkout failed");
        return;
      }

      const { internalOrderId, restaurantId, total, cashfreeOrderId } = response;

      const razorpayOrderId = cashfreeOrderId;

      if (!razorpayOrderId) {
        alert("Razorpay order id missing from backend");
        return;
      }

      const amountInPaise = Math.round(total * 100).toString();

      router.push({
        pathname: "/razorpay-webview",
        params: {
          order_id: razorpayOrderId,
          amount: amountInPaise,
          key_id: "rzp_test_S5k3kvgmXRiymn",
          name: "Grabbit",
          description: `Order ${internalOrderId}`,
          prefill_name: userName || "Customer",
          prefill_email: meData?.me?.email || "test@example.com",
          prefill_contact: meData?.me?.mobileNumber || "9999999999",

          // ✅ extra (optional)
          internalOrderId,
          restaurantId,
        },
      });
    } catch (err) {
      console.error("❌ Payment start error:", err);
      alert("Payment failed to start");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ------------------ UI ------------------

  if (loading || meLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  if (!data?.getCart?.items?.length) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-gray-500 text-base">Your cart is empty</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-orange-500 pt-14 pb-8 px-6 rounded-b-[40px] shadow-xl mb-6 z-10">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-4xl font-outfit-extrabold text-white tracking-tight">
            My Cart
          </Text>

          <TouchableOpacity
            onPress={handleClearAll}
            activeOpacity={0.7}
            className="flex-row bg-white/20 px-3 py-2 rounded-full items-center border border-white/30"
          >
            <Ionicons name="trash-outline" size={16} color="white" />
            <Text className="text-white font-outfit-bold text-xs uppercase tracking-wide ml-2">
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-orange-50 text-sm font-outfit-medium tracking-wide opacity-90 pl-1 mb-4">
          {data?.getCart?.items?.length || 0} items waiting for you
        </Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={data.getCart.items}
        keyExtractor={(item) => item.dishId}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="flex-row bg-white rounded-[24px] p-4 mb-5 items-center shadow-lg shadow-orange-500/10 border-2 border-orange-200">
            <Image
              source={{ uri: item.imageUrl }}
              className="w-20 h-20 rounded-xl bg-gray-200"
              resizeMode="cover"
            />

            <View className="flex-1 ml-4 justify-between h-20 py-1">
              <View>
                <Text
                  className="text-base font-outfit-bold text-gray-800 leading-tight"
                  numberOfLines={2}
                >
                  {item.dishName}
                </Text>
                <Text className="text-sm font-outfit-extrabold text-orange-600 mt-1">
                  ₹{item.price * item.quantity}
                </Text>
              </View>

              <Text className="text-[10px] text-gray-400 font-outfit-medium">
                ₹{item.price} / item
              </Text>
            </View>

            <View className="flex-col items-center justify-between h-20 py-0.5 ml-2">
              <TouchableOpacity
                onPress={() => handleQuantityChange(item, 1)}
                disabled={loadingItemId === item.dishId}
                className="bg-orange-500 w-7 h-7 rounded-full justify-center items-center shadow-sm"
              >
                <Text className="text-lg font-outfit-bold text-white leading-5">
                  +
                </Text>
              </TouchableOpacity>

              {loadingItemId === item.dishId ? (
                <ActivityIndicator size="small" color="#f97316" />
              ) : (
                <Text className="text-base font-outfit-bold text-gray-800">
                  {item.quantity}
                </Text>
              )}

              <TouchableOpacity
                onPress={() => handleQuantityChange(item, -1)}
                disabled={loadingItemId === item.dishId}
                className="bg-gray-50 w-7 h-7 rounded-full justify-center items-center border border-gray-200"
              >
                <Text className="text-lg font-outfit-bold text-gray-600 leading-5">
                  -
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Checkout Button */}
      {data?.getCart?.items?.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="pl-2">
              <Text className="text-gray-400 font-outfit-medium text-sm">
                Total Bill
              </Text>
              <Text className="text-3xl font-outfit-extrabold text-gray-900">
                ₹
                {data.getCart.items.reduce(
                  (acc, item) => acc + item.price * item.quantity,
                  0
                )}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              disabled={checkoutLoading}
              activeOpacity={0.8}
              className="flex-1 ml-6 bg-orange-500 py-4 rounded-2xl shadow-xl shadow-orange-500/30 flex-row justify-center items-center"
            >
              {checkoutLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text className="text-center text-white text-lg font-outfit-bold mr-2">
                    Checkout
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Payment Processing Loading Modal */}
      <Modal visible={isProcessingPayment} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-2xl items-center shadow-xl">
            <ActivityIndicator size="large" color="#f97316" />
            <Text className="text-gray-800 font-semibold mt-4 text-base">
              Processing Payment...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
