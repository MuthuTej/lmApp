// apollo.js
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const httpLink = new HttpLink({
  uri: 'https://lm-backend-production-d237.up.railway.app/graphql', // ✅ Ensure /graphql
});

const authLink = new ApolloLink((operation, forward) => {
  return AsyncStorage.getItem('token').then((token) => {
    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    });
    return forward(operation);
  });
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
