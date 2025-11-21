import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import KioskWebView from './src/components/KioskWebView';
import PairingModal from './src/components/PairingModal';
import ErrorScreen from './src/components/ErrorScreen';
import PaymentResultOverlay from './src/components/PaymentResultOverlay';
import { initializeTerminal, discoverAndConnect, isReaderConnected, onConnectionChanged } from './src/stripe/terminal';

export default function App() {
  const [pairingVisible, setPairingVisible] = useState(false);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<any>(null);

  useEffect(() => {
    let unsubNet: any;
    let unsubTerminal: any = () => { };

    const runStartup = async () => {
      try {
        setStatus('initializing');
        setErrorMessage(null);
        console.log('BoonsKioskFlow: 2. [RN] App.tsx - Starting initialization');

        const net = await NetInfo.fetch();
        if (!net.isConnected) throw new Error('No network connection');

        await initializeTerminal();

        await discoverAndConnect();

        const connected = await isReaderConnected();
        if (!connected) throw new Error('Reader not connected after discovery');

        setStatus('ready');
      } catch (err: any) {
        console.error('[App] startup error', err);
        setErrorMessage(err?.message || String(err));
        setStatus('error');
      }
    };

    runStartup();

    // NetInfo listener: if connection returns, auto-retry
    unsubNet = NetInfo.addEventListener(state => {
      if (state.isConnected && status === 'error') {
        runStartup();
      }
      if (!state.isConnected) {
        setErrorMessage('No network connection');
        setStatus('error');
      }
    });

    // Terminal connection listener
    unsubTerminal = onConnectionChanged((connected: boolean) => {
      if (!connected) {
        setErrorMessage('Reader disconnected');
        setStatus('error');
      }
    });

    // AppState: when app becomes active, do a quick health check
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active' && status === 'ready') {
        (async () => {
          const connected = await isReaderConnected();
          if (!connected) {
            setErrorMessage('Reader disconnected');
            setStatus('error');
          }
        })();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);

    return () => {
      unsubNet && unsubNet();
      unsubTerminal && unsubTerminal();
      appStateSub.remove();
    };
  }, []);

  // secret gesture: 5 taps in 2 seconds on top-left corner
  const handleSecretTap = () => {
    tapCountRef.current += 1;
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => (tapCountRef.current = 0), 2000);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setPairingVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      {status === 'ready' && <KioskWebView />}
      {status === 'error' && (
        <ErrorScreen
          message={errorMessage || 'Unknown error'}
          onRetry={() => {
            // simple retry: reload the app by re-mounting startup effect via a state toggle
            setStatus('initializing');
            setErrorMessage(null);
            (async () => {
              try {
                const net = await NetInfo.fetch();
                if (!net.isConnected) throw new Error('No network connection');
                await initializeTerminal();
                await discoverAndConnect();
                const connected = await isReaderConnected();
                if (!connected) throw new Error('Reader not connected after discovery');
                setStatus('ready');
              } catch (err: any) {
                setErrorMessage(err?.message || String(err));
                setStatus('error');
              }
            })();
          }}
          onOpenPairing={() => setPairingVisible(true)}
        />
      )}

      {/* secret tap area (transparent) */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleSecretTap}
        style={styles.secretTapArea}
      />

      <PairingModal visible={pairingVisible} onClose={() => setPairingVisible(false)} />
      <PaymentResultOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  secretTapArea: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
});
