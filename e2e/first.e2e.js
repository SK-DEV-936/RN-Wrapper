/**
 * Minimal Detox test scaffold.
 * Adjust `.detoxrc.json` and APK paths for your environment.
 */

describe('BoonsKiosk basic', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
  });

  it('shows the kiosk webview', async () => {
    // Wait for the WebView to appear
    await waitFor(element(by.id('kiosk-webview'))).toBeVisible().withTimeout(10000);
    // If present, the app started and loaded the WebView (simulated reader expected in emulator)
    await expect(element(by.id('kiosk-webview'))).toBeVisible();
  });

  it('receives payment result from test page', async () => {
    // Wait for the native overlay to show the payment result
    await waitFor(element(by.id('payment-result-native'))).toBeVisible().withTimeout(15000);
    await expect(element(by.id('payment-result-native'))).toHaveText();
  });
});
