const { AppRegistry } = require('react-native');
const App = require('./App').default || require('./App');

// Native Android `MainActivity#getMainComponentName()` expects "TempRNApp".
// Register the JS component under that name so the native side can find it.
const appName = 'TempRNApp';

AppRegistry.registerComponent(appName, () => App);
