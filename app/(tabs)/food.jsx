// CartScreen.jsx
import React,{useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import {gql,useQuery,useMutation} from "@apollo/client";

// --- GraphQL Queries/Mutations ---
const GET_CART=gql`
  query GetCart($userId:String!){
    getCart(userId:$userId){
      restaurantId
      items{
        dishId
        name
        price
        quantity
        imageUrl
      }
    }
  }
`;

const ADD_TO_CART=gql`
  mutation AddToCart(
    $userId:String!
    $restaurantId:String!
    $dishId:String!
    $name:String!
    $price:Float!
    $imageUrl:String!
    $quantity:Int!
  ){
    addToCart(
      userId:$userId
      restaurantId:$restaurantId
      dishId:$dishId
      name:$name
      price:$price
      imageUrl:$imageUrl
      quantity:$quantity
    )
  }
`;

const CLEAR_CART=gql`
  mutation ClearCart($userId:String!){
    clearCart(userId:$userId)
  }
`;

const CHECKOUT_CART=gql`
  mutation CheckoutCart($userId:String!){
    checkoutCart(userId:$userId)
  }
`;

const ME=gql`
  query{
    me{
      id
      email
    }
  }
`;

export default function CartScreen(){
  const {data:meData,loading:meLoading}=useQuery(ME);
  const userId=meData?.me?.id||null;
  const [loadingItemId,setLoadingItemId]=useState(null);

  const {data,loading,refetch}=useQuery(GET_CART,{
    variables:{userId},
    fetchPolicy:"network-only",
    skip:!userId,
  });

  const [addToCart]=useMutation(ADD_TO_CART,{
    onCompleted:()=>{
      setLoadingItemId(null);
      refetch();
    },
  });

  const [clearCart]=useMutation(CLEAR_CART,{onCompleted:()=>refetch()});

  const [checkoutCart,{loading:checkoutLoading}]=useMutation(CHECKOUT_CART,{
    onCompleted:()=>{
      refetch();
      alert("Checkout successful!");
    },
    onError:(err)=>alert(`Checkout failed: ${err.message}`),
  });

  const handleQuantityChange=(item,change)=>{
    setLoadingItemId(item.dishId);
    addToCart({
      variables:{
        userId,
        restaurantId:data?.getCart?.restaurantId||"",
        dishId:item.dishId,
        name:item.name,
        price:item.price,
        imageUrl:item.imageUrl,
        quantity:change,
      },
    });
  };

  const handleClearAll=()=>{
    if(!userId) return alert("Please login first");
    clearCart({variables:{userId}});
  };

  const handleCheckout=()=>{
    if(!userId) return alert("Please login first");
    checkoutCart({variables:{userId}});
  };

  if(loading||meLoading){
    return(
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#f97316"/>
      </SafeAreaView>
    );
  }

  if(!data?.getCart?.items?.length){
    return(
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-gray-500 text-base">Your cart is empty</Text>
      </SafeAreaView>
    );
  }

  return(
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
        keyExtractor={(item)=>item.dishId}
        contentContainerStyle={{paddingHorizontal:16,paddingBottom:120}}
        renderItem={({item})=>(
          <View className="flex-row bg-gray-50 rounded-2xl p-4 mb-4 items-center shadow-lg border border-gray-200">
            {/* Image */}
            <Image source={{uri:item.imageUrl}} className="w-[60px] h-[60px] rounded-lg"/>

            {/* Middle text (name & price) */}
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-gray-800">{item.name}</Text>
              <Text className="text-sm text-pink-600 font-medium mt-1">₹{item.price}</Text>
            </View>

            {/* Right controls */}
            <View className="flex-row items-center">
              {/* Decrease */}
              <TouchableOpacity
                onPress={()=>handleQuantityChange(item,-1)}
                disabled={loadingItemId===item.dishId}
                className="bg-gray-200 w-8 h-8 rounded-full justify-center items-center"
              >
                <Text className="text-lg font-bold text-gray-600">-</Text>
              </TouchableOpacity>

              {loadingItemId===item.dishId?(
                <ActivityIndicator size="small" color="#f97316" className="mx-3"/>
              ):(
                <Text className="mx-3 text-base font-medium text-gray-700">{item.quantity}</Text>
              )}

              {/* Increase */}
              <TouchableOpacity
                onPress={()=>handleQuantityChange(item,1)}
                disabled={loadingItemId===item.dishId}
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
          {checkoutLoading?(
            <ActivityIndicator size="small" color="#fff"/>
          ):(
            <Text className="text-center text-white text-lg font-semibold">Checkout</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
