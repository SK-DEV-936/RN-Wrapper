import React, {useState} from 'react';
import {Modal, View, Text, StyleSheet, Button, ActivityIndicator, Alert} from 'react-native';
import {discoverAndConnect} from '../stripe/terminal';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function PairingModal({visible, onClose}: Props) {
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const startPairing = async () => {
    setWorking(true);
    setStatus('requesting permissions...');
    try {
      setStatus('discovering readers...');
      await discoverAndConnect();
      setStatus('connected');
      Alert.alert('Reader paired', 'Reader connected successfully');
    } catch (err: any) {
      console.error('[PairingModal] error', err);
      setStatus(`error: ${err?.message || String(err)}`);
      Alert.alert('Pairing failed', err?.message || String(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Pair Reader</Text>
          <Text style={styles.status}>{status ?? 'idle'}</Text>

          <View style={styles.actions}>
            <Button title="Start Pairing" onPress={startPairing} disabled={working} />
            <View style={{width: 8}} />
            <Button title="Close" onPress={onClose} color="#666" />
          </View>

          {working && (
            <View style={styles.loading}>
              <ActivityIndicator />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 320,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {fontSize: 18, fontWeight: '600', marginBottom: 8},
  status: {marginBottom: 12, color: '#333'},
  actions: {flexDirection: 'row', justifyContent: 'flex-end'},
  loading: {marginTop: 12},
});
