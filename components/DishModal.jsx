import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gql, useMutation, useQuery } from '@apollo/client';

const ME = gql`
  query {
    me {
      id
      email
      name
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
        alert("Unable to add item to cart.");
      }
    }
  };
  console.log(userId, restaurant.name, dish.name);
  if (!visible || !dish) return null;

  return (

    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/30">
          <TouchableWithoutFeedback>
            <SafeAreaView className="bg-white rounded-t-2xl p-4" style={{ maxHeight: '75%' }}>
              {/* Grab bar */}
              <View className="items-center">
                <View className="w-10 h-1 bg-gray-400 rounded-full mb-3" />
              </View>

              {/* Dish Image */}
              <Image source={{ uri: dish.imageUrl }} className="w-full h-48 rounded-lg" />

              {/* Dish Details */}
              <Text className="text-lg font-bold mt-2 text-black">{dish.name}</Text>
              <Text className="text-gray-600 text-sm">{dish.description}</Text>
              <Text className="text-base font-bold mt-1 text-green-600">₹{dish.price}</Text>

              {/* Quantity Selector */}
              <View className="flex-row items-center mt-3 justify-center">
                <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))}>
                  <Ionicons name="remove-circle" size={32} color="#F59E0B" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-black mx-4">{qty}</Text>
                <TouchableOpacity onPress={() => setQty(qty + 1)}>
                  <Ionicons name="add-circle" size={32} color="#F59E0B" />
                </TouchableOpacity>
              </View>

              {/* Add to Cart Button */}
              <TouchableOpacity
                onPress={handleAddToCart}
                disabled={loading || meLoading}
                className="bg-yellow-500 rounded-lg py-3 mt-5"
              >
                <Text className="text-center text-white font-bold">
                  {loading ? 'Adding...' : `Add ${qty} • ₹${dish.price * qty}`}
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity onPress={onClose} className="items-center mt-3">
                <Text className="text-red-600 font-bold">Cancel</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
