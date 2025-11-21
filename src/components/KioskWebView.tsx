import React, { useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { startPayment } from '../stripe/terminal';
import { KIOSK_WEB_URL } from '../config';
import { emit } from '../utils/events';

// Message types between WebView (web app) and native
export type FromWebMessage = {
  type: 'START_PAYMENT';
  amount: number; // in cents
  currency: string; // e.g. 'usd'
};

export type ToWebMessage = {
  type: 'PAYMENT_RESULT';
  success: boolean;
  paymentIntentId?: string;
  errorMessage?: string;
};

const KIOSK_URL = KIOSK_WEB_URL;

export default function KioskWebView() {
  const webviewRef = useRef<WebView | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Trace mount
  React.useEffect(() => {
    console.log('BoonsKioskFlow: 3. [RN] KioskWebView mounted');
  }, []);

  const postResultToWeb = useCallback((msg: ToWebMessage) => {
    const payload = JSON.stringify(msg);
    console.log('[KioskWebView] posting to webview:', payload);
    webviewRef.current?.postMessage(payload);
    // also emit native event for E2E testing / overlay
    try { emit('payment_result', msg); } catch (_) { }
  }, []);

  const handleWebMessage = useCallback(async (event: WebViewMessageEvent) => {
    console.log('[KioskWebView] received message:', event.nativeEvent.data);
    let parsed: any;
    try {
      parsed = JSON.parse(event.nativeEvent.data);
    } catch (err) {
      console.warn('[KioskWebView] could not parse message from webview', err);
      return;
    }

    if (parsed?.type === 'START_PAYMENT') {
      const { amount, currency } = parsed as FromWebMessage;
      console.log('BoonsKioskFlow: 4. [RN] KioskWebView received START_PAYMENT', { amount, currency });

      setLoadingPayment(true);
      try {
        const result = await startPayment(amount, currency);
        const msg: ToWebMessage = {
          type: 'PAYMENT_RESULT',
          success: !!result.success,
          paymentIntentId: result.paymentIntentId,
          errorMessage: result.errorMessage,
        };
        postResultToWeb(msg);
      } catch (err: any) {
        console.error('[KioskWebView] startPayment error', err);
        const msg: ToWebMessage = {
          type: 'PAYMENT_RESULT',
          success: false,
          errorMessage: err?.message || String(err),
        };
        postResultToWeb(msg);
      } finally {
        setLoadingPayment(false);
      }
    } else {
      console.log('[KioskWebView] unknown message type', parsed);
    }
  }, [postResultToWeb]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ uri: KIOSK_URL }}
        testID="kiosk-webview"
        javaScriptEnabled
        onMessage={handleWebMessage}
        startInLoadingState
        userAgent="Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
      />

      {loadingPayment && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
