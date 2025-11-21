import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { on } from '../utils/events';

const DISMISS_TIME_MS = 5000;

export default function PaymentResultOverlay() {
  const [message, setMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current; // start 50px down

  useEffect(() => {
    console.log('[PaymentResultOverlay] Mounted');
    let timerInterval: any;
    let dismissTimeout: any;

    const unsub = on('payment_result', (msg: any) => {
      console.log('[PaymentResultOverlay] Received event:', msg);
      const t = msg?.success ? 'Payment Successful!' : `Payment Failed: ${msg.errorMessage || 'Unknown error'}`;
      setMessage(t);
      setTimeLeft(DISMISS_TIME_MS / 1000);

      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Countdown timer
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto dismiss
      if (dismissTimeout) clearTimeout(dismissTimeout);
      dismissTimeout = setTimeout(() => {
        // Animate out
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setMessage(null);
        });
      }, DISMISS_TIME_MS);
    });

    return () => {
      unsub();
      if (timerInterval) clearInterval(timerInterval);
      if (dismissTimeout) clearTimeout(dismissTimeout);
    };
  }, [fadeAnim, slideAnim]);

  // Only render in dev (Detox runs in debug) to avoid exposing to customers
  // if (!__DEV__) return null; // Commented out to allow testing on release builds if needed, but keeping safe for now

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none">
      <View style={styles.card}>
        <Text style={styles.title}>{message}</Text>
        <Text style={styles.subtitle}>Closing in {timeLeft}s...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 200,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
  },
});
