import React, { useMemo } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function RazorpayWebview() {
  const router = useRouter();

  const {
    order_id,
    amount,
    key_id,
    name,
    description,
    prefill_name,
    prefill_email,
    prefill_contact,
  } = useLocalSearchParams();

  const html = useMemo(() => {
    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

          <style>
            body {
              margin: 0;
              padding: 0;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: Arial, sans-serif;
              background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 45%, #fed7aa 100%);
            }

            .card {
              width: 88%;
              max-width: 380px;
              background: white;
              border-radius: 22px;
              padding: 26px 22px;
              box-shadow: 0px 18px 40px rgba(0,0,0,0.12);
              text-align: center;
              border: 1px solid rgba(249,115,22,0.18);
            }

            .topBadge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 10px 14px;
              border-radius: 999px;
              background: rgba(249,115,22,0.10);
              color: #ea580c;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 14px;
            }

            .logoCircle {
              width: 68px;
              height: 68px;
              border-radius: 999px;
              background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px auto;
              box-shadow: 0px 10px 25px rgba(249,115,22,0.35);
            }

            .logoInner {
              width: 44px;
              height: 44px;
              border-radius: 999px;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              font-weight: 800;
              color: #f97316;
            }

            h2 {
              margin: 0;
              font-size: 18px;
              font-weight: 800;
              color: #111827;
              letter-spacing: 0.2px;
            }

            p {
              margin: 10px 0 0 0;
              color: #6b7280;
              font-size: 13px;
              line-height: 18px;
            }

            .amountBox {
              margin-top: 16px;
              padding: 14px;
              border-radius: 16px;
              background: #fff7ed;
              border: 1px solid rgba(249,115,22,0.20);
            }

            .amountLabel {
              font-size: 12px;
              color: #9a3412;
              font-weight: 700;
              margin-bottom: 6px;
            }

            .amountValue {
              font-size: 20px;
              font-weight: 900;
              color: #ea580c;
            }

            .dots {
              margin-top: 14px;
              display: flex;
              justify-content: center;
              gap: 6px;
            }

            .dot {
              width: 7px;
              height: 7px;
              border-radius: 999px;
              background: rgba(249,115,22,0.25);
              animation: bounce 1s infinite ease-in-out;
            }

            .dot:nth-child(2) { animation-delay: 0.15s; }
            .dot:nth-child(3) { animation-delay: 0.30s; }

            @keyframes bounce {
              0%, 100% { transform: translateY(0px); opacity: 0.4; }
              50% { transform: translateY(-6px); opacity: 1; }
            }

            .footer {
              margin-top: 18px;
              font-size: 11px;
              color: #9ca3af;
            }
          </style>
        </head>

        <body>
          <div class="card">
            <div class="topBadge">Secure Payment • Razorpay</div>

            <div class="logoCircle">
              <div class="logoInner">₹</div>
            </div>

            <h2>Opening Payment Gateway</h2>
            <p>Please wait… We are preparing your Razorpay checkout.</p>

            <div class="amountBox">
              <div class="amountLabel">PAYABLE AMOUNT</div>
              <div class="amountValue">₹ ${Number(amount || 0) / 100}</div>
            </div>

            <div class="dots">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>

            <div class="footer">Do not press back while payment is processing.</div>
          </div>

          <script>
            function openRazorpay() {
              var options = {
                key: "${key_id}",
                amount: "${amount}",
                currency: "INR",
                name: "${name}",
                description: "${description}",
                order_id: "${order_id}",
                prefill: {
                  name: "${prefill_name}",
                  email: "${prefill_email}",
                  contact: "${prefill_contact}"
                },
                theme: { color: "#f97316" },

                handler: function (response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: "SUCCESS",
                    data: response
                  }));
                },

                modal: {
                  ondismiss: function () {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: "CANCELLED"
                    }));
                  }
                }
              };

              var rzp = new Razorpay(options);
              rzp.open();
            }

            setTimeout(openRazorpay, 800);
          </script>
        </body>
      </html>
    `;
  }, [
    order_id,
    amount,
    key_id,
    name,
    description,
    prefill_name,
    prefill_email,
    prefill_contact,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff7ed" }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingTitle}>Opening Razorpay…</Text>
            <Text style={styles.loadingSub}>Please wait a moment</Text>
          </View>
        )}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);

            if (msg.type === "SUCCESS") {
              console.log("✅ WebView Razorpay success:", msg.data);

              router.replace({
                pathname: "/food",
                params: { paymentSuccess: "true" },
              });
            } else {
              console.log("❌ WebView Razorpay cancelled");

              router.replace({
                pathname: "/food",
                params: { paymentSuccess: "false" },
              });
            }
          } catch (e) {
            console.log("WebView message parse error", e);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 20,
  },
  loadingTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  loadingSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
});
