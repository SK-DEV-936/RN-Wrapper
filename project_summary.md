# BoonsKioskM2 - Project Summary

## Overview
**BoonsKioskM2** is a React Native application designed to serve as a wrapper for a kiosk web application. Its primary function is to bridge the gap between a web-based kiosk interface and physical hardware, specifically the **Stripe Terminal Reader M2**, to enable card-present payments.

## Key Functionality
*   **Hybrid Architecture:** Loads the main kiosk user interface from a remote web URL into a full-screen `WebView`.
*   **Payment Bridge:** Establishes a two-way communication bridge between the web app and the native Android layer.
    *   **Web -> Native:** The web app sends `START_PAYMENT` messages with amount and currency.
    *   **Native -> Web:** The native app processes the payment via Stripe SDK and returns `PAYMENT_RESULT` (success/failure) to the web app.
*   **Hardware Integration:** Manages the lifecycle of the Stripe Reader M2 connection (Bluetooth Low Energy).
    *   Handles discovery, connection, and payment collection.
    *   Auto-reconnect logic for network and reader connectivity.
*   **Admin Controls:** Includes a hidden "Secret Gesture" (5 taps in the top-left corner) to access a native **Pairing Modal** for staff to connect/manage the card reader without exposing these controls to customers.

## Technical Stack
*   **Framework:** React Native (v0.71) with TypeScript.
*   **Core Dependencies:**
    *   `react-native-webview`: For hosting the web application.
    *   `@stripe/stripe-terminal-react-native`: Official SDK for Stripe Terminal integration.
    *   `@react-native-community/netinfo`: For network connectivity monitoring.
*   **Testing:** E2E testing scaffold using **Detox**.

## Configuration & Setup
*   **Config:** Centralized configuration in `src/config.ts` for backend endpoints (`CONNECTION_TOKEN_URL`, `CREATE_PAYMENT_INTENT_URL`) and the Kiosk Web URL.
*   **Permissions:** Handles Android permissions for Internet, Bluetooth (Scan/Connect), and Location services required for the reader.

## Workflow
1.  **App Launch:** Checks network, initializes Stripe Terminal, and attempts to auto-connect to a known reader.
2.  **Kiosk Mode:** Displays the web app.
3.  **Payment Flow:**
    *   User initiates payment on Web UI.
    *   Web UI posts message to Native.
    *   Native app wakes reader, collects payment, and confirms transaction.
    *   Native app sends result back to Web UI to update display.
