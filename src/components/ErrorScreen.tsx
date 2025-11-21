import React, {useState} from 'react';
import {View, Text, StyleSheet, Button, TouchableOpacity} from 'react-native';

type Props = {
  message: string;
  onRetry: () => void;
  onOpenPairing?: () => void;
};

function getFriendlyMessage(raw: string | null): string {
  if (!raw) return 'An unknown error occurred.';
  const m = raw.toLowerCase();
  if (m.includes('no network') || m.includes('network')) return 'No internet connection. Please connect the tablet to Wi‑Fi.';
  if (m.includes('permission') || m.includes('denied')) return 'Permissions are required. Please enable Bluetooth and Location for the app.';
  if (m.includes('no readers') || m.includes('no reader') || m.includes('no readers found')) return 'No card reader found. Make sure the Stripe Reader M2 is powered on and nearby.';
  if (m.includes('reader disconnected') || m.includes('disconnected')) return 'Card reader disconnected. Try re-pairing the reader.';
  if (m.includes('create_payment_intent')) return 'Payment creation failed. Please try again or contact support.';
  if (m.includes('connection_token')) return 'Failed to connect to payment backend. Check network and backend configuration.';
  // default
  return 'An unexpected error occurred. Staff can view details below.';
}

export default function ErrorScreen({message, onRetry, onOpenPairing}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const friendly = getFriendlyMessage(message);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kiosk temporarily unavailable</Text>
      <Text style={styles.friendly}>{friendly}</Text>

      <View style={styles.actions}>
        <Button title="Retry" onPress={onRetry} />
        {onOpenPairing && <View style={{width: 12}} />}
        {onOpenPairing && <Button title="Staff: Pair Reader" onPress={onOpenPairing} />}
      </View>

      <TouchableOpacity onPress={() => setShowDetails(s => !s)} style={styles.detailsToggle}>
        <Text style={styles.detailsToggleText}>{showDetails ? 'Hide details' : 'Show details'}</Text>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsLabel}>Technical details</Text>
          <Text style={styles.detailsText}>{message || '—'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff'},
  title: {fontSize: 22, fontWeight: '700', marginBottom: 12},
  friendly: {textAlign: 'center', color: '#333', marginBottom: 18, fontSize: 16},
  actions: {flexDirection: 'row', marginBottom: 12},
  detailsToggle: {marginTop: 8},
  detailsToggleText: {color: '#007aff'},
  detailsBox: {marginTop: 12, padding: 12, backgroundColor: '#f7f7f7', borderRadius: 6, width: '100%'},
  detailsLabel: {fontWeight: '600', marginBottom: 6},
  detailsText: {color: '#444', fontSize: 13},
});
