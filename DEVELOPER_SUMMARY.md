# BoonsKioskM2 Developer Summary

## Project Overview
**BoonsKioskM2** is a React Native wrapper application designed to host a kiosk web application and integrate it with the Stripe Terminal Reader M2. It serves as a bridge between the web-based kiosk interface and the native Android layer required for Bluetooth Low Energy (BLE) communication with the card reader.

## Architecture
The app consists of a single main screen (`App.tsx`) that renders a `KioskWebView`. This WebView loads the remote web app and exposes a communication channel for payment operations.

*   **Web Layer**: The kiosk web app (loaded from `KIOSK_WEB_URL`).
*   **Bridge Layer**: `KioskWebView.tsx` handles `postMessage` communication.
*   **Native Layer**: `src/stripe/terminal.ts` interacts with the `@stripe/stripe-terminal-react-native` SDK.

## Web <-> Native Bridge
Communication is handled via JSON messages sent over `window.ReactNativeWebView.postMessage` (from web) and `webviewRef.current.postMessage` (from native).

### Message Protocol

**1. Request: Start Payment (Web -> Native)**
The web app initiates a payment by sending:
```json
{
  "type": "START_PAYMENT",
  "amount": 1000,       // Amount in cents
  "currency": "usd"
}
```

**2. Response: Payment Result (Native -> Web)**
The native app processes the payment and responds:
```json
{
  "type": "PAYMENT_RESULT",
  "success": true,      // or false
  "paymentIntentId": "pi_123...",
  "errorMessage": "Optional error message"
}
```

### Code Snippet: KioskWebView.tsx
The `KioskWebView` component listens for messages and triggers the Stripe flow:
```typescript
// src/components/KioskWebView.tsx
const handleWebMessage = useCallback(async (event: WebViewMessageEvent) => {
  const parsed = JSON.parse(event.nativeEvent.data);
  if (parsed?.type === 'START_PAYMENT') {
    try {
      const result = await startPayment(parsed.amount, parsed.currency);
      postResultToWeb({
        type: 'PAYMENT_RESULT',
        success: !!result.success,
        paymentIntentId: result.paymentIntentId,
      });
    } catch (err) {
      postResultToWeb({
        type: 'PAYMENT_RESULT',
        success: false,
        errorMessage: err.message
      });
    }
  }
}, []);
```

## Stripe Terminal Integration
The integration is encapsulated in `src/stripe/terminal.ts`.

### Key Functions
*   `initializeTerminal()`: Sets up the Stripe SDK with a connection token provider.
*   `discoverAndConnect()`: Scans for BLE readers and connects to the first available one.
*   `startPayment(amount, currency)`: Creates a PaymentIntent, collects the payment method via the reader, and processes the payment.

### Connection Token Provider
The SDK requires a backend endpoint to fetch a connection token. In development, we use a mock backend.
```typescript
// src/config.ts
export const CONNECTION_TOKEN_URL = 'http://10.0.2.2:8080/connection_token';
```

## Pairing Flow
A hidden "Secret Gesture" (5 taps in the top-left corner of `App.tsx`) opens the `PairingModal`.
*   **PairingModal**: Calls `discoverAndConnect()` when the user taps "Start Pairing".
*   **Permissions**: The app requests `ACCESS_FINE_LOCATION`, `BLUETOOTH_SCAN`, and `BLUETOOTH_CONNECT` at runtime.

## Configuration & Troubleshooting

### 1. Simulated Mode
For development on emulators, `simulated: true` MUST be set in `src/config.ts`.
```typescript
export const STRIPE_TERMINAL_OPTIONS = {
  simulated: true, // Set to false for physical devices
  discoveryMethod: 'bluetoothScan',
};
```

### 2. Google OAuth in WebView
Google blocks OAuth requests from embedded WebViews by default. We bypass this by overriding the User Agent in `KioskWebView.tsx`:
```typescript
<WebView
  userAgent="Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
  // ... other props
/>
```

### 3. Backend Token Error
If you see "token could not be" errors, ensure the mock backend is running and `src/config.ts` points to `10.0.2.2` (localhost alias for Android emulator).
*   **Run Backend**: `cd mock-backend && node server.js`

### 4. Permissions
Ensure `AndroidManifest.xml` includes:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```
And that these are requested at runtime (handled in `terminal.ts`).

### 5. Java Version Compatibility
The project's Gradle version (7.5.1) requires **Java 11** or **Java 17**.
*   **Issue**: Using newer versions like Java 23 will cause `java.lang.NullPointerException` in the R8/D8 dexer.
*   **Fix**: Ensure `JAVA_HOME` points to a Java 17 installation before running build commands.
    ```bash
    export JAVA_HOME=$(/usr/libexec/java_home -v 17)
    npm run android
    ```

## Debugging Tools

### 1. Metro Bundler (Basic)
The terminal running `npm start` shows `console.log` output from the React Native app.
*   **Usage**: Good for quick print debugging.
*   **Access**: Check the terminal window where you started the packager.

### 2. Flipper (Advanced)
This project is configured with **Flipper 0.125.0**. It provides a visual interface for:
*   **Logs**: View device logs and JS logs.
*   **Network**: Inspect API requests (requires `flipper-network-plugin`).
*   **Layout**: Inspect the UI hierarchy.
*   **Databases**: View local databases.

**Setup**:
1.  Download Flipper (compatible version recommended).
2.  Launch Flipper while the app is running on the emulator.
3.  Select the running app from the list.

### 3. Android Logcat (Native)
For native crashes or Stripe Terminal SDK logs.
*   **Command**: `adb logcat *:S React:V StripeTerminal:V`
*   **Filter**: Use `grep` to filter for specific tags.

### 4. Tracing the App Flow (Breakpoints)
We have added high-visibility logs to trace the critical path from Native -> React Native -> WebView -> Payment.
To see these "breakpoints" in real-time:

1.  **Run this command**:
    ```bash
    adb logcat *:S BoonsKioskFlow:V
    ```
2.  **Reload the App**:
    *   Press `R` twice on the emulator, or run: `adb shell input keyevent 82` -> Reload.
    *   *Watch for*: `[Native] MainActivity focused` and `[RN] App.tsx - Starting initialization`.
3.  **Trigger a Payment**:
    *   Use the web interface to start a payment.
    *   *Watch for*: `[RN] KioskWebView received START_PAYMENT` and `[RN] terminal.ts startPayment`.
