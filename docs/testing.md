Testing & Debugging

This guide explains how to run the app, pair the Reader M2, test payments (Stripe test mode), and debug issues.

1) Install dependencies and run the app

```bash
# from project root (after you ran `npx react-native init BoonsKioskM2`)
npm install
npm install @react-native-community/netinfo react-native-webview @stripe/stripe-terminal-react-native

# start Metro
npx react-native start

# in another terminal, run on a connected Android device
npx react-native run-android
```

2) Optional: run the local mock backend (for local testing)

The repo includes a small mock server under `mock-backend/` that emulates the two endpoints used by the app. To run:

```bash
cd mock-backend
npm install
node server.js
```

- By default the mock server listens on port `8080`. Update `src/config.ts` to point `CONNECTION_TOKEN_URL` and `CREATE_PAYMENT_INTENT_URL` to `http://<your-ip>:8080/connection_token` and `http://<your-ip>:8080/create_payment_intent` respectively.

3) Pairing the Stripe Reader M2

- Make sure the Reader M2 is powered on and in Bluetooth pairing mode.
- On app launch the kiosk attempts to initialize and auto-pair. If successful the web app will load.
- If auto-pairing fails, the `ErrorScreen` displays a friendly message explaining the problem; staff can tap "Staff: Pair Reader" (or use the secret top-left gesture: 5 taps in 2 seconds) to open the Pairing modal and run discovery manually.

4) Testing payments (Stripe test mode)

- Use Stripe test mode in your backend. The RN app only talks to your backend for `connection_token` and `create_payment_intent`.
- For testing in the mock server the mock returns placeholder secrets and accepts any amount.
- When you call the web action `startPayment(...)` (see `docs/web-integration.md`) the native layer will:
  1. POST to `CREATE_PAYMENT_INTENT_URL` and expect `{ clientSecret: string }`.
  2. Call the Terminal SDK to collect the payment method on the connected reader.
  3. Call the Terminal SDK to process the payment intent.
  4. Post back `{ type: 'PAYMENT_RESULT', success, paymentIntentId?, errorMessage? }` to the web app.

5) Useful debug commands

- View Metro & RN logs (JS logs): check the Metro terminal.
- View Android device logs (native + console logs):

```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

- Filter for our tags (we log with `[terminal]`, `[KioskWebView]`, `[App]`):

```bash
adb logcat | grep "\[terminal\]\|\[KioskWebView\]\|\[App\]"
```

6) Common failures and tips

- No network: Ensure tablet Wi‑Fi is connected; update `src/config.ts` to reachable backend.
- Permissions denied: On Android 12+ enable `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and Location in system settings for the app.
- No readers found: Ensure the Reader M2 is powered and nearby; try moving closer or restart the reader.
- SDK method mismatch: If logs show `collectPaymentMethod not available`, your installed `@stripe/stripe-terminal-react-native` version may expose different method names — tell me the method names from logs and I will adapt the helper.

If you want, I can extend the mock backend to call the real Stripe APIs (server-side) to create real test-mode connection tokens and PaymentIntents — tell me and I'll add an example Node script with Stripe keys (you must provide test keys).
