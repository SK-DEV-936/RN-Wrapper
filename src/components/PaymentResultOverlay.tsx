import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {on, off} from '../utils/events';

export default function PaymentResultOverlay() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const unsub = on('payment_result', (msg: any) => {
      const t = msg?.success ? `Payment succeeded: ${msg.paymentIntentId || ''}` : `Payment failed: ${msg.errorMessage || ''}`;
      setText(t);
    });
    return () => unsub();
  }, []);

  // Only render in dev (Detox runs in debug) to avoid exposing to customers
  if (!__DEV__) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Text testID="payment-result-native" style={styles.text}>{text ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: 8,
    borderRadius: 6,
  },
});
