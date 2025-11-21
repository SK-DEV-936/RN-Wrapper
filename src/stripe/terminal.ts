import { Platform, PermissionsAndroid } from 'react-native';
import Terminal from '@stripe/stripe-terminal-react-native';

export type PaymentResult = {
  success: boolean;
  paymentIntentId?: string;
  errorMessage?: string;
};

import {
  CONNECTION_TOKEN_URL as CONFIG_CONNECTION_TOKEN_URL,
  CREATE_PAYMENT_INTENT_URL as CONFIG_CREATE_PAYMENT_INTENT_URL,
  STRIPE_TERMINAL_OPTIONS,
} from '../config';

const CONNECTION_TOKEN_URL = CONFIG_CONNECTION_TOKEN_URL;
const CREATE_PAYMENT_INTENT_URL = CONFIG_CREATE_PAYMENT_INTENT_URL;

let initialized = false;

async function fetchConnectionToken(): Promise<string> {
  console.log('[terminal] fetching connection token from backend');
  const res = await fetch(CONNECTION_TOKEN_URL, { method: 'POST' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`connection_token fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  if (!json?.secret) throw new Error('connection_token response missing `secret`');
  return json.secret;
}

async function requestAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const perms = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_CONNECT',
  ];

  try {
    const result = await PermissionsAndroid.requestMultiple(perms as any);
    for (const p of perms) {
      if (result[p] !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('[terminal] permission denied:', p, result[p]);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('[terminal] requestAndroidPermissions error', err);
    return false;
  }
}

export async function initializeTerminal(): Promise<void> {
  if (initialized) return;
  console.log('[terminal] initializeTerminal()');

  try {
    await Terminal.initialize({ fetchConnectionToken });
    initialized = true;
    console.log('[terminal] Terminal initialized');
  } catch (err: any) {
    console.error('[terminal] Terminal.initialize error', err);
    throw err;
  }
}

export async function discoverAndConnect(locationId?: string): Promise<void> {
  console.log('[terminal] discoverAndConnect()');
  const ok = await requestAndroidPermissions();
  if (!ok) throw new Error('required Android permissions not granted');

  try {
    // discover readers via bluetooth scan
    const discoveryOptions = {
      discoveryMethod: (STRIPE_TERMINAL_OPTIONS as any)?.discoveryMethod || 'bluetoothScan',
      simulated: (STRIPE_TERMINAL_OPTIONS as any)?.simulated || false,
    };
    const discovery = await Terminal.discoverReaders(discoveryOptions as any);

    const readers = (discovery && (discovery as any).readers) || [];
    if (!readers || readers.length === 0) {
      throw new Error('no readers found');
    }

    const reader = readers[0];
    console.log('[terminal] found reader', reader);

    // connect to the reader
    try {
      // prefer connectReader if available
      if ((Terminal as any).connectReader) {
        await (Terminal as any).connectReader({ reader, locationId });
      } else if ((Terminal as any).connectBluetoothReader) {
        await (Terminal as any).connectBluetoothReader(reader);
      } else {
        throw new Error('no compatible connect method on Terminal SDK');
      }
      console.log('[terminal] connected to reader');
    } catch (err) {
      console.error('[terminal] connect error', err);
      throw err;
    }
  } catch (err) {
    console.error('[terminal] discover/connect error', err);
    throw err;
  }
}

export async function startPayment(amount: number, currency: string): Promise<PaymentResult> {
  console.log('BoonsKioskFlow: 5. [RN] terminal.ts startPayment called', { amount, currency });

  try {
    if (!initialized) await initializeTerminal();

    // create PaymentIntent on backend
    const res = await fetch(CREATE_PAYMENT_INTENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`create_payment_intent failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    const clientSecret = json?.clientSecret;
    if (!clientSecret) throw new Error('create_payment_intent response missing clientSecret');

    console.log('[terminal] collected clientSecret, collecting payment method');

    // collectPaymentMethod: the RN SDK API may differ; using dynamic access to stay resilient
    let collected: any;
    if ((Terminal as any).collectPaymentMethod) {
      collected = await (Terminal as any).collectPaymentMethod(clientSecret);
    } else if ((Terminal as any).collect) {
      collected = await (Terminal as any).collect(clientSecret);
    } else {
      throw new Error('Terminal.collectPaymentMethod not available on SDK');
    }

    console.log('[terminal] collectPaymentMethod result', collected);

    // processPayment
    let processed: any;
    if ((Terminal as any).processPayment) {
      processed = await (Terminal as any).processPayment(collected);
    } else if ((Terminal as any).process) {
      processed = await (Terminal as any).process(collected);
    } else {
      throw new Error('Terminal.processPayment not available on SDK');
    }

    console.log('[terminal] processPayment result', processed);

    const paymentIntentId = (processed && processed.paymentIntent && processed.paymentIntent.id) || (collected && collected.paymentIntent && collected.paymentIntent.id);

    console.log('BoonsKioskFlow: 6. [RN] terminal.ts startPayment success', { paymentIntentId });
    return { success: true, paymentIntentId };
  } catch (err: any) {
    console.error('[terminal] startPayment error', err);
    return { success: false, errorMessage: err?.message || String(err) };
  }
}

export default {
  initializeTerminal,
  discoverAndConnect,
  startPayment,
};

// Additional helpers for app health checks
export async function isReaderConnected(): Promise<boolean> {
  try {
    const reader = await (Terminal as any).getConnectedReader?.();
    return !!reader;
  } catch (err) {
    console.warn('[terminal] isReaderConnected error', err);
    return false;
  }
}

type Unsubscribe = () => void;
export function onConnectionChanged(cb: (connected: boolean) => void): Unsubscribe {
  // If SDK exposes event emitter, hook into it
  const anyTerminal: any = Terminal as any;
  if (anyTerminal.addListener) {
    // Common pattern: 'connectionStatus' or 'readerConnected' events may exist; try a few
    const subscriptions: any[] = [];
    try {
      subscriptions.push(anyTerminal.addListener('connectionStatus', (e: any) => cb(!!e?.connected)));
      subscriptions.push(anyTerminal.addListener('readerConnected', (e: any) => cb(true)));
      subscriptions.push(anyTerminal.addListener('readerDisconnected', (e: any) => cb(false)));
    } catch (err) {
      console.warn('[terminal] addListener attempts failed', err);
    }

    return () => subscriptions.forEach(s => s.remove && s.remove());
  }

  // Fallback: no-op
  return () => { };
}
