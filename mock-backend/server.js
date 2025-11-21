const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple connection_token endpoint (mock)
app.post('/connection_token', (req, res) => {
  // Return a dummy secret — in real backends this should call Stripe's SDK to create a connection token
  res.json({ secret: 'mock_connection_token_secret' });
});

// Simple create_payment_intent endpoint (mock)
app.post('/create_payment_intent', (req, res) => {
  const { amount, currency } = req.body || {};
  // In production, create a PaymentIntent with Stripe server SDK and return client_secret
  // Here we return a fake client secret for testing the RN flow
  res.json({ clientSecret: `mock_pi_${amount || '0'}_${currency || 'usd'}_secret_xxx` });
});

// Serve a simple test page for E2E that auto-triggers a START_PAYMENT postMessage
app.get('/test-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-page.html'));
});

// Serve static files (if any)
app.use('/static', express.static(path.join(__dirname, 'static')));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Mock backend listening on http://localhost:${port}`));
