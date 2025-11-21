# Web Integration Guide

This guide explains how your Web Application should communicate with the `BoonsKioskM2` Native App to initiate payments.

## 1. Sending a Payment Request (Web -> Native)

When the user clicks "Pay" in your Web App, you must send a message to the Native App using `window.ReactNativeWebView.postMessage`.

**Code Snippet:**

```javascript
function initiateKioskPayment(amountInCents, currency = 'usd') {
  if (window.ReactNativeWebView) {
    const payload = {
      type: 'START_PAYMENT',
      amount: amountInCents, // e.g., 1000 for $10.00
      currency: currency
    };

    // Send message to Native App
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    console.log('Sent START_PAYMENT to Kiosk App');
  } else {
    console.warn('Not running inside BoonsKioskM2 App');
    // Fallback logic (e.g., show regular Stripe Elements web form)
  }
}
```

## 2. Handling the Result (Native -> Web)

The Native App will process the payment via the Stripe Terminal M2 Reader and send a message back to your Web App. You need to listen for this message.

**Code Snippet:**

```javascript
window.addEventListener('message', (event) => {
  try {
    // The Native App sends data as a JSON string
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

    if (data.type === 'PAYMENT_RESULT') {
      if (data.success) {
        // ✅ Payment Successful
        console.log('Payment Success!', data.paymentIntentId);
        alert('Payment Successful!');
        // TODO: Redirect to success page / clear cart
      } else {
        // ❌ Payment Failed
        console.error('Payment Failed:', data.errorMessage);
        alert('Payment Failed: ' + data.errorMessage);
        // TODO: Allow user to retry
      }
    }
  } catch (err) {
    // Ignore messages that aren't JSON or aren't from our app
  }
});
```

## 3. Testing

To test this integration without the Native App, you can simulate the Native environment in your browser console:

**Simulate Native App Presence:**
```javascript
window.ReactNativeWebView = {
  postMessage: (msg) => console.log('Native received:', msg)
};
```

**Simulate Payment Success (Run in Console):**
```javascript
window.postMessage(JSON.stringify({
  type: 'PAYMENT_RESULT',
  success: true,
  paymentIntentId: 'pi_mock_12345'
}), '*');
```
