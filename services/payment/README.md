# Payment Service

Processes trip charges, refunds, and payment events.

## API
- `POST /v1/payments/charge`
- `POST /v1/payments/:id/refund`
- `GET /v1/payments/:id`
- `GET /metrics`
- `GET /health`

## Environment Variables
- `DB_PATH` (default: `payments.db`)
- `TRIP_SERVICE_URL` (default: `http://ride:3000`)
- `RABBITMQ_URL` (default: `amqp://rabbitmq:5672`)
- `EVENTS_EXCHANGE` (default: `ride.events`)
- `PAYMENT_QUEUE` (default: `payment.queue`)

## Run Locally
```bash
npm install
node app.js
```

## Docker
```bash
docker build -t ride-hailing-payment-service .
docker run -p 3003:3000 ride-hailing-payment-service
```
