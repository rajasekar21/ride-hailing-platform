# Driver Service

Manages drivers, availability, and vehicle details.

## API
- `POST /v1/drivers`
- `GET /v1/drivers`
- `GET /v1/drivers/:id`
- `PATCH /v1/drivers/:id/status`
- `GET /health`

## Environment Variables
- `DB_PATH` (default: `drivers.db`)

## Run Locally
```bash
npm install
node app.js
```

## Docker
```bash
docker build -t ride-hailing-driver-service .
docker run -p 3002:3000 -e DB_PATH=/data/drivers.db ride-hailing-driver-service
```
