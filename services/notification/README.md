# Notification Service

Consumes platform events and emits notification logs.

## API
- `POST /v1/notifications`
- `GET /metrics`
- `GET /health`

## Environment Variables
- `RABBITMQ_URL` (default: `amqp://rabbitmq:5672`)
- `EVENTS_EXCHANGE` (default: `ride.events`)
- `NOTIFICATION_QUEUE` (default: `notification.queue`)

## Run Locally
```bash
npm install
node app.js
```

## Docker
```bash
docker build -t ride-hailing-notification-service .
docker run -p 3004:3000 ride-hailing-notification-service
```
