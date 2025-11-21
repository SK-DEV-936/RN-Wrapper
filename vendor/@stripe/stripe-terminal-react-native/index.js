// Minimal JavaScript stub for @stripe/stripe-terminal-react-native
// This provides a lightweight, simulated Terminal API so local `npm install`
// and development runs can proceed without the native SDK available.

let _fetchConnectionToken = null;
let _connectedReader = null;

module.exports = {
  async initialize({fetchConnectionToken} = {}) {
    if (fetchConnectionToken) _fetchConnectionToken = fetchConnectionToken;
    console.log('[stub-terminal] initialized (JS-only)');
    // Try to fetch a token once to mirror real behavior (best-effort)
    try {
      if (_fetchConnectionToken) {
        const token = await _fetchConnectionToken();
        console.log('[stub-terminal] fetched connection token', typeof token === 'string' ? token.substring(0,6) : token);
      }
    } catch (err) {
      console.warn('[stub-terminal] fetchConnectionToken failed (ignored)', err && err.message ? err.message : err);
    }
  },

  async discoverReaders(opts = {}) {
    console.log('[stub-terminal] discoverReaders', opts);
    // Return a simulated reader list
    return {readers: [
      {id: 'sim-m2-1', label: 'Simulated Reader M2', serialNumber: 'SIM-M2-001', deviceSoftwareVersion: '1.0.0'}
    ]};
  },

  async connectReader({reader, locationId} = {}) {
    console.log('[stub-terminal] connectReader', reader, locationId);
    _connectedReader = reader || {id: 'sim-m2-1'};
    return {connected: true, reader: _connectedReader};
  },

  async connectBluetoothReader(reader) {
    console.log('[stub-terminal] connectBluetoothReader', reader);
    _connectedReader = reader || {id: 'sim-m2-1'};
    return {connected: true, reader: _connectedReader};
  },

  async collectPaymentMethod(clientSecret) {
    console.log('[stub-terminal] collectPaymentMethod', clientSecret);
    // Simulate collecting a card and returning a paymentIntent-like object
    return {paymentIntent: {id: 'pi_sim_collected', client_secret: clientSecret}};
  },

  async processPayment(collected) {
    console.log('[stub-terminal] processPayment', collected);
    return {paymentIntent: {id: 'pi_sim_processed'}};
  },

  async getConnectedReader() {
    return _connectedReader;
  },

  addListener(eventName, cb) {
    console.log('[stub-terminal] addListener', eventName);
    // No real events; return a dummy subscription handle
    return {remove: () => {}};
  },

  // Common alternative method names used by the app
  collect: async function(clientSecret) { return this.collectPaymentMethod(clientSecret); },
  process: async function(collected) { return this.processPayment(collected); },
  connectBluetooth: async function(reader) { return this.connectBluetoothReader(reader); },
  connect: async function(opts) { return this.connectReader(opts); },
};
