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

        // Auto-return to home screen after 5 seconds
        if (result.success) {
          setTimeout(() => {
            console.log('[KioskWebView] Auto-returning to home screen');
            webviewRef.current?.injectJavaScript("window.location.href = '/'; true;");
          }, 5000);
        }
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
        domStorageEnabled
        javaScriptEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        applicationNameForUserAgent="BoonsKiosk"
        onMessage={handleWebMessage}
        injectedJavaScript={`
          (function() {
            if (document.getElementById('rn-test-pay-btn')) return;
            var btn = document.createElement('button');
            btn.id = 'rn-test-pay-btn';
            btn.innerHTML = 'Test Pay $10';
            btn.style.position = 'fixed';
            btn.style.bottom = '20px';
            btn.style.right = '20px';
            btn.style.zIndex = '9999';
            btn.style.padding = '15px 20px';
            btn.style.backgroundColor = '#007AFF';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '8px';
            btn.style.fontSize = '16px';
            btn.style.fontWeight = 'bold';
            btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            btn.onclick = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'START_PAYMENT',
                amount: 1000,
                currency: 'usd'
              }));
            };
            document.body.appendChild(btn);
          })();
          true;
        `}
        startInLoadingState
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
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
