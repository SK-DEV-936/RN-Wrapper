BoonsKioskM2 — React Native wrapper for kiosk web app

Overview
--------
This project is a minimal React Native (TypeScript) wrapper that loads your kiosk web app inside a `WebView` and bridges payment requests to Stripe Terminal (Reader M2) via the official React Native SDK. The native layer discovers/connects the reader and performs card-present payments, returning results to the web app.

Important files
- `src/components/KioskWebView.tsx` — WebView wrapper and message bridge.
- `src/stripe/terminal.ts` — Stripe Terminal helper (initialize, discover/connect, startPayment).
- `src/config.ts` — Single config file: set `KIOSK_WEB_URL`, backend endpoints, and terminal options here.

Run these commands from your workspace root to create a proper native project and install deps:

E2E testing scaffold
--------------------
I added a small E2E scaffold using Detox and a test HTML page in `mock-backend/test-page.html` that auto-triggers a payment when the WebView loads.

Quick notes:
- The test page posts `START_PAYMENT` on load and shows the result in the DOM. Useful for automation.
- Detox config lives under `e2e/` — you'll need to install Detox and update AVD and APK paths in `e2e/.detoxrc.json` before running tests.

If you'd like, I can finish configuring the Detox scripts for your CI environment or help run the first test locally.
Detox (detailed setup)
----------------------
Quick checklist to run Detox locally and in CI:

- Install Android SDK, Android Studio tools, and create an AVD matching the name in `e2e/.detoxrc.json` (or update that file with your AVD name). Example AVD: `Pixel_4a_API_31`.
- Ensure `ANDROID_HOME` is set and emulator images for API 31 are installed.
- From the repo root install dependencies and the `e2e` dev deps:

```bash
npm ci
cd e2e && npm ci
```

- Build the Android debug & androidTest APKs (Detox needs both):

```bash
cd android
./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug
```

- Run the Detox tests (from `e2e/`):

```bash
cd e2e
npx detox test --configuration android.emu.debug
```

CI notes
- A sample GitHub Actions workflow is included at `.github/workflows/detox-android.yml`. It is a starting point — you may need to adjust emulator options, API level, or Gradle caching for your CI.

If you want me to fully tailor the CI workflow to your environment (AVD name, matrix, or self-hosted runners), tell me the target runner and any constraints and I'll adapt the workflow.

```bash
# create a TypeScript RN app (generates native Android files)
npx react-native init BoonsKioskM2 --template react-native-template-typescript
cd BoonsKioskM2

# install required packages
npm install react-native-webview @stripe/stripe-terminal-react-native

# start metro and run android (connected device or emulator)
npx react-native start
npx react-native run-android
```

Configuration
-------------
Edit `src/config.ts` and replace the placeholder backend URLs:

- `CONNECTION_TOKEN_URL` — POST endpoint that returns `{ secret: string }` for Stripe Terminal connection tokens.
- `CREATE_PAYMENT_INTENT_URL` — POST endpoint that creates a PaymentIntent and returns `{ clientSecret: string }`.

Android permissions
-------------------
Add these permissions to `android/app/src/main/AndroidManifest.xml` (the project includes a sample file):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

On Android 12+ you must also request `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` at runtime. The helper code in `src/stripe/terminal.ts` requests these permissions automatically before discovery.

How the bridge works
---------------------
- The web app should call `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'START_PAYMENT', amount, currency }))` when a payment is requested.
- `KioskWebView` listens for that message, calls `startPayment(amount, currency)` from `src/stripe/terminal.ts`, and posts the result back to the web app as `{ type: 'PAYMENT_RESULT', success, paymentIntentId?, errorMessage? }`.

Testing & debugging notes
-------------------------
- Use a real Android device (recommended) for Bluetooth discovery/pairing; some emulators don't support BLE.
- Put Stripe into test mode and use Stripe test card numbers. No real charges will occur in test mode.
- Logs: check `adb logcat` or Metro console for `console.log` output from the RN app. The terminal helper logs discover/connect/collect/process steps.

Next steps
----------
- Replace backend URLs in `src/config.ts` with your real endpoints.
- Optionally add a small pairing UI to call `discoverAndConnect()` manually before payments (recommended for kiosks).
- I can provide a minimal web snippet and step-by-step test instructions next.
Gesture-based pairing
---------------------
This app includes a hidden, gesture-based pairing flow to avoid exposing pairing controls to all kiosk users.

- Secret gesture: tap the top-left corner area 5 times within 2 seconds to open the Pairing modal.
- The Pairing modal lets staff discover and connect a Stripe Reader M2.

Web integration snippet
-----------------------
See `docs/web-integration.md` for the minimal JS your web kiosk needs to call native and receive payment results.
