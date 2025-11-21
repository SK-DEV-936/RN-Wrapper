Web integration (kiosk web app)

This file shows the minimal JavaScript snippet to call the native app and receive payment results.

1) Posting a payment request to the native app

```js
// amount in cents
function startPayment(amount, currency = 'usd') {
  const payload = { type: 'START_PAYMENT', amount, currency };
  window.ReactNativeWebView.postMessage(JSON.stringify(payload));
}
```

2) Listen for payment results from native

```js
window.addEventListener('message', (evt) => {
  try {
    const msg = JSON.parse(evt.data);
    if (msg.type === 'PAYMENT_RESULT') {
      handlePaymentResult(msg);
    }
  } catch (err) {
    console.warn('invalid message from native', err);
  }
});

function handlePaymentResult(msg) {
  if (msg.success) {
    // Payment succeeded; msg.paymentIntentId available
    showSuccessUI(msg.paymentIntentId);
    // Web app handles reset logic: show confirmation, then reset after configured timeout
    setTimeout(() => {
      resetOrderUI(); // Clear cart, reset to initial state, etc.
    }, 10000); // Your configured timeout (e.g., 10 seconds)
  } else {
    // Failure; show error
    showErrorUI(msg.errorMessage || 'Payment failed');
  }
}

function resetOrderUI() {
  // Clear cart, reset form, show start screen, etc.
  clearCart();
  showStartScreen();
}
```

Notes
- Use `window.ReactNativeWebView.postMessage(...)` only when the web app is running inside the RN wrapper. Guard this call if your web app can also run in a browser.
- `amount` should be in the smallest currency unit (cents for USD).
- The native app will post back `{ type: 'PAYMENT_RESULT', success, paymentIntentId?, errorMessage? }`.
- The web app should handle resetting the order UI after showing the success confirmation (e.g., after a timeout).
