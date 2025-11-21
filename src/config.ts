// Central configuration for the kiosk app. Replace placeholder URLs with real endpoints.
export const KIOSK_WEB_URL = 'https://boons-kiosk-96641bb3.base44.app';

// Backend endpoints (replace with your real backend)
export const CONNECTION_TOKEN_URL = 'http://192.168.2.83:8080/connection_token';
export const CREATE_PAYMENT_INTENT_URL = 'http://192.168.2.83:8080/create_payment_intent';

// Stripe Terminal options
export const STRIPE_TERMINAL_OPTIONS = {
  // If you want to simulate during development, set simulated: true
  simulated: false,
  // Default discovery method
  discoveryMethod: 'bluetoothScan',
};

// Android runtime permissions required by the app. The code will request these at runtime.
export const ANDROID_PERMISSIONS = [
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.BLUETOOTH_SCAN',
  'android.permission.BLUETOOTH_CONNECT',
];

export default {
  KIOSK_WEB_URL,
  CONNECTION_TOKEN_URL,
  CREATE_PAYMENT_INTENT_URL,
  STRIPE_TERMINAL_OPTIONS,
  ANDROID_PERMISSIONS,
};
