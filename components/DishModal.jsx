import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gql, useMutation, useQuery } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const ME = gql`
  query {
    me {
      id
      email
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart(
    $userId: String!
    $restaurantId: String!
    $dishId: String!
    $name: String!
    $price: Float!
    $imageUrl: String!
    $quantity: Int!
  ) {
    addToCart(
      userId: $userId
      restaurantId: $restaurantId
      dishId: $dishId
      name: $name
      price: $price
      imageUrl: $imageUrl
      quantity: $quantity
    )
  }
`;

export default function DishModal({ visible, dish, onClose, restaurant }) {
  const { data: meData, loading: meLoading } = useQuery(ME, { skip: !visible });
  const [userId, setUserId] = useState(null);
  const [qty, setQty] = useState(1);
  const [addToCartMutation, { loading }] = useMutation(ADD_TO_CART);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (meData?.me?.id) setUserId(meData.me.id);
    return () => {
      isMounted.current = false;
    };
  }, [meData]);

  if (!dish) return null;

  const handleAddToCart = async () => {
    if (!userId) {
      alert('You must be logged in to add items to your cart.');
      return;
    }
    try {
      await addToCartMutation({
        variables: {
          userId,
          restaurantId: restaurant.name,
          dishId: dish.name,
          name: dish.name,
          price: Number(dish.price),
          imageUrl: dish.imageUrl,
          quantity: qty,
        },
      });
      if (isMounted.current) {
        setQty(1);
        onClose();
      }
    } catch (err) {
      if (isMounted.current) alert(err.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
  <TouchableWithoutFeedback onPress={onClose}>
    <View className="flex-1 justify-end bg-black/30">
      <TouchableWithoutFeedback>
        <SafeAreaView
          edges={['bottom']}
          className="bg-yellow-50 rounded-t-3xl p-5 shadow-xl"
          style={{ minHeight: '55%' }}
        >
          {/* Grab Bar */}
          <View className="items-center mb-3">
            <View className="w-14 h-2 bg-orange-300 rounded-full" />
          </View>

          {/* Dish Image */}
          <View className="rounded-2xl overflow-hidden shadow-lg mb-4 border-2 border-orange-400">
            <Image
              source={{ uri: dish.imageUrl }}
              className="w-full h-48"
              style={{ resizeMode: 'cover' }}
            />
          </View>

          {/* Dish Details */}
          <Text className="text-2xl font-extrabold text-orange-700 mb-1">
            {dish.name}
          </Text>
          <Text className="text-gray-700 text-sm mb-2">{dish.description}</Text>
          <Text className="text-xl font-bold text-orange-600">
            ₹{dish.price}
          </Text>

          {/* Quantity Selector */}
          <View className="flex-row items-center justify-center mt-5">
            <TouchableOpacity
              onPress={() => setQty(Math.max(1, qty - 1))}
              className="p-2 bg-orange-100 rounded-full mx-3 shadow"
            >
              <Ionicons name="remove" size={28} color="#F97316" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-orange-700">{qty}</Text>
            <TouchableOpacity
              onPress={() => setQty(qty + 1)}
              className="p-2 bg-orange-100 rounded-full mx-3 shadow"
            >
              <Ionicons name="add" size={28} color="#F97316" />
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={loading || meLoading}
            className="rounded-xl mt-6 overflow-hidden shadow-lg"
          >
            <LinearGradient
              colors={['#F59E0B', '#FCD34D']}
              className="py-3 px-5 rounded-xl"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text className="text-center text-white text-lg font-bold">
                {loading ? 'Adding...' : `Add ${qty} • ₹${dish.price * qty}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity onPress={onClose} className="items-center mt-3">
            <Text className="text-red-500 font-bold text-base">Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>
  );
}
