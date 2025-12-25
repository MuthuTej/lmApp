// CartScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from "react-native";
import { gql, useQuery, useMutation } from "@apollo/client";
import { WebView } from "react-native-webview";

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
    }
  }
`;

const CREATE_CASHFREE_ORDER = gql`
  mutation CreateCashfreeOrder(
    $restaurantId: String!
    $internalOrderId: String!
    $total: Float!
  ) {
    createCashfreeOrder(
      restaurantId: $restaurantId
      internalOrderId: $internalOrderId
      total: $total
    ) {
      paymentSessionId
      success
    }
  }
`;

const ME = gql`
  query {
    me {
      id
      email
      name
    }
  }
`;

// ------------------ Component ------------------

export default function CartScreen() {
  const { data: meData, loading: meLoading } = useQuery(ME);
  const userId = meData?.me?.id || null;
  const userName = meData?.me?.name || null;

  const [loadingItemId, setLoadingItemId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showWebView, setShowWebView] = useState(false);

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
  });

  const [clearCart] = useMutation(CLEAR_CART, {
    onCompleted: () => refetch(),
  });

  const [checkoutCart, { loading: checkoutLoading }] =
    useMutation(CHECKOUT_CART);

  const [createCashfreeOrder] =
    useMutation(CREATE_CASHFREE_ORDER);

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

    try {
      // ✅ Existing checkout logic
      const checkoutRes = await checkoutCart({
        variables: { userId },
      });

      const {
        internalOrderId,
        restaurantId,
        total,
      } = checkoutRes.data.checkoutCart;

      // ✅ Create Cashfree order
      const cfRes = await createCashfreeOrder({
        variables: {
          restaurantId,
          internalOrderId,
          total,
        },
      });

      const paymentSessionId =
        cfRes.data.createCashfreeOrder.paymentSessionId;

      // ✅ Open Cashfree Web Checkout
      const url = `https://sandbox.cashfree.com/pg/view/sessions/checkout/web/${paymentSessionId}`;

      setPaymentUrl(url);
      setShowWebView(true);

    } catch (err) {
      console.error(err);
      alert("Payment failed to start");
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-12 pb-4">
        <Text className="text-xl font-bold text-gray-800">Orders</Text>
        <TouchableOpacity
          onPress={handleClearAll}
          className="bg-red-500 px-3 py-1 rounded-lg"
        >
          <Text className="text-white font-semibold">Clear all</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <FlatList
        data={data.getCart.items}
        keyExtractor={(item) => item.dishId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View className="flex-row bg-gray-50 rounded-2xl p-4 mb-4 items-center shadow-lg border border-gray-200">
            <Image
              source={{ uri: item.imageUrl }}
              className="w-[60px] h-[60px] rounded-lg"
            />

            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-gray-800">
                {item.dishName}
              </Text>
              <Text className="text-sm text-pink-600 font-medium mt-1">
                ₹{item.price}
              </Text>
            </View>

            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => handleQuantityChange(item, -1)}
                disabled={loadingItemId === item.dishId}
                className="bg-gray-200 w-8 h-8 rounded-full justify-center items-center"
              >
                <Text className="text-lg font-bold text-gray-600">-</Text>
              </TouchableOpacity>

              {loadingItemId === item.dishId ? (
                <ActivityIndicator size="small" color="#f97316" className="mx-3" />
              ) : (
                <Text className="mx-3 text-base font-medium text-gray-700">
                  {item.quantity}
                </Text>
              )}

              <TouchableOpacity
                onPress={() => handleQuantityChange(item, 1)}
                disabled={loadingItemId === item.dishId}
                className="bg-orange-500 w-8 h-8 rounded-full justify-center items-center"
              >
                <Text className="text-lg font-bold text-white">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Checkout Button */}
      <View className="p-4 bg-white border-t border-gray-200 shadow-md">
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={checkoutLoading}
          className="bg-orange-500 py-4 rounded-lg"
        >
          {checkoutLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-center text-white text-lg font-semibold">
              Checkout
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Cashfree WebView */}
      <Modal visible={showWebView} animationType="slide">
        <SafeAreaView className="flex-1 bg-white">
          <TouchableOpacity
            onPress={() => {setShowWebView(false) 
              refetch() }}
            className="p-4 bg-red-500"
          >
            <Text className="text-white text-center font-semibold">
              Close Payment
            </Text>
          </TouchableOpacity>

          {paymentUrl && (
            <WebView source={{ uri: paymentUrl }} startInLoadingState />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
