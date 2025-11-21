const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Stripe with your secret key
const stripe = require('stripe')('USE_KEY_HERE_FROM_STRIPE'); // TODO: Replace with real key

// Connection token endpoint
app.post('/connection_token', async (req, res) => {
  try {
    const token = await stripe.terminal.connectionTokens.create();
    res.json({ secret: token.secret });
  } catch (error) {
    console.error('Error creating connection token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create payment intent endpoint
app.post('/create_payment_intent', async (req, res) => {
  const { amount, currency } = req.body || {};
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 1000,
      currency: currency || 'usd',
      payment_method_types: ['card_present'],
      capture_method: 'manual',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve a simple test page for E2E that auto-triggers a START_PAYMENT postMessage
app.get('/test-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-page.html'));
});

// Serve static files (if any)
app.use('/static', express.static(path.join(__dirname, 'static')));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Mock backend listening on http://localhost:${port}`));
