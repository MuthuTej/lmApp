# Real World Usage Test Report

## 2️⃣ User Frontend Testing (UX failures = user drop)

### A. Happy Path + Stupid Path

| Test Case | Status | Observation | Recommendation |
| :--- | :--- | :--- | :--- |
| **Click twice** | ❌ **FAIL** | In `sign-in.jsx` and `sign-up.jsx`, the submit buttons do not disable while `loading` is true. A user can click multiple times, potentially triggering multiple API calls. | Disable the button and show a spinner when `loading` is true. |
| **Refresh mid-action** | ⚠️ **RISK** | State is local. Refreshing will lose form data. | Persist form data in `AsyncStorage` or Context if this is a critical requirement, but standard behavior is acceptable for mobile apps. |
| **Close tab** | N/A | Mobile app behavior. | N/A |
| **Go back/forward** | ✅ **PASS** | `expo-router` handles navigation stack correctly. | N/A |
| **Use slow internet** | ⚠️ **RISK** | `Loader` component exists, but specific timeout handling is not visible in UI. | Implement explicit timeout error messages. |
| **Double submit button click** | ❌ **FAIL** | See "Click twice". | Prevent multiple submissions programmatically. |
| **Reload page during API call** | ⚠️ **RISK** | No cancellation logic seen for unmounting components during mutations. | Use `AbortController` or Apollo's cleanup if needed, though less critical for simple auth. |

### B. Input & Validation

| Test Case | Status | Observation | Recommendation |
| :--- | :--- | :--- | :--- |
| **Copy-paste huge text** | ⚠️ **RISK** | No `maxLength` prop on `TextInput`. | Add `maxLength` to inputs (e.g., 50 for name, 320 for email). |
| **Emojis** | ✅ **PASS** | React Native handles text strings well. | Ensure backend sanitizes inputs if they are displayed elsewhere. |
| **SQL-like text** | ✅ **PASS** | `search.jsx` uses client-side filtering safely. GraphQL variables prevent injection. | Continue using parameterized queries/variables. |
| **Leading/trailing spaces** | ❌ **FAIL** | `sign-in.jsx` does not trim inputs. `sign-up.jsx` checks `!name.trim()` but sends raw `name` to mutation. | Use `.trim()` before sending data to the API. |
| **Empty but valid-looking fields** | ❌ **FAIL** | `sign-in.jsx` has NO client-side validation before API call. `sign-up.jsx` checks for empty but not format (e.g., "a@b" is valid email?). | Add Regex validation for Email and Password strength checks. |

### C. Network Conditions

| Test Case | Status | Observation | Recommendation |
| :--- | :--- | :--- | :--- |
| **Offline mode** | ⚠️ **PARTIAL** | `_layout.jsx` allows staying logged in on network error, but no global "You are offline" banner. | Add `NetInfo` listener to show a global offline banner. |
| **API timeout** | ❌ **FAIL** | No specific UI for timeouts. Users might see generic "Error" or nothing. | Add specific error handling for timeout exceptions. |
| **Loading states** | ✅ **PASS** | `Loader` component is used in `search.jsx`. Auth forms show "Signing in..." text. | Consistent use of `ActivityIndicator` is better than text changes. |
| **Retry options** | ❌ **FAIL** | No "Retry" button seen on error screens (e.g., `search.jsx` just says "No Results" or logs error). | Add a "Retry" button for failed network requests. |

### D. Security from User Perspective

| Test Case | Status | Observation | Recommendation |
| :--- | :--- | :--- | :--- |
| **Sensitive data exposed** | ✅ **PASS** | `secureTextEntry` used for passwords. | Ensure logging (e.g., `console.log`) does not print passwords in production. |
| **Modify request payload** | ✅ **PASS** | GraphQL enforces types. | Ensure backend validation rules (e.g., `email` format) are strict. |
| **Access another user’s data** | ❓ **CHECK** | `_layout.jsx` checks `me { id }`. | Ensure all backend resolvers check `context.userId` matches the requested resource owner. |

### E. Accessibility & Device Reality

| Test Case | Status | Observation | Recommendation |
| :--- | :--- | :--- | :--- |
| **Small screens** | ✅ **PASS** | Uses `react-native-safe-area-context` and `ScrollView`. | Verify on iPhone SE / small Android devices. |
| **Keyboard-only navigation** | ⚠️ **RISK** | `KeyboardAvoidingView` is used, but tab order/focus management isn't explicit. | Test with external keyboard on device. |
| **Screen reader basics** | ❌ **FAIL** | Inputs lack `accessibilityLabel`. `TouchableOpacity` often lacks `accessibilityRole="button"`. | Add `accessibilityLabel` and `accessibilityRole` props to all interactive elements. |
| **Touch targets** | ✅ **PASS** | Buttons look large enough (padding used). | Ensure all touch targets are at least 44x44 points. |

## Summary
The app has a solid foundation with `expo-router` and Apollo Client, but lacks critical "polish" features for a robust real-world experience. **Input validation** and **accessibility** are the biggest gaps. Double-submission bugs in Auth forms are critical UX failures.
