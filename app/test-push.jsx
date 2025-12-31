import { gql, useMutation } from '@apollo/client';

const SEND_TEST_PUSH = gql`
  mutation SendTestPush($token: String!) {
    sendTestPushNotification(
      token: $token
      title: "Hello 👋"
      body: "Push from GraphQL backend 🚀"
    )
  }
`;

const [sendPush] = useMutation(SEND_TEST_PUSH);

// call this after token is generated
await sendPush({
  variables: {
    token: expoPushToken,
  },
});
