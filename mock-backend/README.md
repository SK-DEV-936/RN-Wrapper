Mock backend for BoonsKioskM2

This simple Express server provides two endpoints used by the app for local testing:

- `POST /connection_token` → returns `{ secret: 'mock_connection_token_secret' }`
- `POST /create_payment_intent` → returns `{ clientSecret: 'mock_pi_<amount>_<currency>_secret_xxx' }`

Usage:

```bash
cd mock-backend
npm install
npm start
```

After starting the server, update `src/config.ts` to point to your machine IP, for example:

```ts
export const CONNECTION_TOKEN_URL = 'http://192.168.1.10:8080/connection_token';
export const CREATE_PAYMENT_INTENT_URL = 'http://192.168.1.10:8080/create_payment_intent';
```

Note: This mock is for local integration testing only. For real processing use your server to call Stripe APIs to create connection tokens and PaymentIntents using your Stripe secret keys.
