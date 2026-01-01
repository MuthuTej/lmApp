// apollo.js
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------- HTTP ----------------
const httpLink = new HttpLink({
  //uri: 'https://lm-backend-zrtl.onrender.com/graphql',
  uri: 'http://10.247.197.202:4000/graphql',
});

// ---------------- Auth ----------------
const authLink = new ApolloLink((operation, forward) => {
  return AsyncStorage.getItem('token').then((token) => {
    operation.setContext({
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    return forward(operation);
  });
});

// ---------------- WebSocket ----------------
const wsLink = new GraphQLWsLink(
  createClient({
    //url: 'wss://lm-backend-zrtl.onrender.com/graphql',
    url: 'ws://10.247.197.202:4000/graphql',
    connectionParams: async () => {
      const token = await AsyncStorage.getItem('token');
      return {
        Authorization: token ? `Bearer ${token}` : '',
      };
    },
    retryAttempts: Infinity,
    on: {
      connected: () => console.log('✅ WebSocket Connected'),
      closed: () => console.log('❌ WebSocket Disconnected'),
      message: (message) => {
        if (message.type === 'next') {
          console.log('📩 WebSocket Notification:', message.payload);
        }
      },
    },
  })
);

// ---------------- Split ----------------
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return (
      def.kind === 'OperationDefinition' &&
      def.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
