// ... imports
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gql, useMutation, useQuery } from '@apollo/client';

// ... Queries (keeping them same)
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

export default function DishModal({ visible, dish, onClose, restaurant }) {
  const { data: meData, loading: meLoading } = useQuery(ME, {
    skip: !visible,
  });
  const userId = meData?.me?.id || null;
  const userName = meData?.me?.name || null;

  const [qty, setQty] = useState(1);
  const [addToCartMutation, { loading }] = useMutation(ADD_TO_CART, {
    refetchQueries: userId
      ? [{ query: GET_CART, variables: { userId } }]
      : [],
    awaitRefetchQueries: true,
  });

  if (!dish) return null;

  const handleAddToCart = async () => {
    if (!userId || !restaurant?.name || !dish?.name) {
      alert("Missing user, restaurant, or dish ID");
      return;
    }

    try {
      await addToCartMutation({
        variables: {
          userId,
          restaurantId: restaurant.name,
          dishId: dish.name,
          dishName: dish.name,
          userName: userName,
          price: Number(dish.price),
          imageUrl: dish.imageUrl,
          quantity: qty,
        },
      });
      setQty(1);
      onClose();
    } catch (err) {
      const message =
        err?.graphQLErrors?.[0]?.message ||
        err.message ||
        "Unable to add item";

      if (message.includes("not available")) {
        alert("This item is currently unavailable.");
      } else if (message.includes("not found")) {
        alert("This item is no longer on the menu.");
      } else {
        alert(message);
      }
    }
  };

  if (!visible || !dish) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/40 backdrop-blur-sm">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl p-6 shadow-2xl max-h-[85%]">
              {/* Grab bar */}
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>

              {/* Dish Image */}
              <View className="shadow-sm rounded-2xl bg-white mb-5">
                <Image source={{ uri: dish.imageUrl }} className="w-full h-56 rounded-2xl bg-gray-100" resizeMode="cover" />
              </View>

              {/* Dish Details */}
              <View className="mb-4">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-2xl font-bold text-gray-900 flex-1 mr-4">{dish.name}</Text>
                  <Text className="text-2xl font-extrabold text-orange-600">₹{dish.price}</Text>
                </View>

                <Text className="text-gray-500 text-sm leading-5 mb-4 font-medium">{dish.description}</Text>

                {/* Divider */}
                <View className="h-[1px] bg-gray-100 my-2" />
              </View>

              {/* Footer Actions */}
              <View className="pt-2">
                {/* Quantity Selector */}
                <View className="flex-row items-center justify-center mb-6 bg-gray-50 self-center rounded-full p-1 border border-gray-200">
                  <TouchableOpacity
                    onPress={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
                  >
                    <Ionicons name="remove" size={24} color="#EA580C" />
                  </TouchableOpacity>

                  <Text className="text-xl font-bold text-gray-800 w-12 text-center">{qty}</Text>

                  <TouchableOpacity
                    onPress={() => setQty(qty + 1)}
                    className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center shadow-sm"
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Buttons */}
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 items-center justify-center py-4 rounded-2xl bg-gray-100 border border-gray-200"
                  >
                    <Text className="text-gray-600 font-bold text-base">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddToCart}
                    disabled={loading || meLoading}
                    className="flex-[2] bg-orange-500 rounded-2xl py-4 items-center justify-center shadow-lg shadow-orange-200"
                  >
                    <Text className="text-white font-bold text-lg tracking-wide">
                      {loading ? 'Adding...' : `Add to Cart - ₹${dish.price * qty}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
