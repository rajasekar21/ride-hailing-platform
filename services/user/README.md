# User Service

Manages rider accounts for the ride-hailing platform.

## API
- `POST /v1/riders`
- `GET /v1/riders`
- `GET /v1/riders/:id`
- `PUT /v1/riders/:id`
- `DELETE /v1/riders/:id`
- `GET /health`

## Environment Variables
- `DB_PATH` (default: `users.db`)

## Run Locally
```bash
npm install
node app.js
```

## Docker
```bash
docker build -t ride-hailing-user-service .
docker run -p 3001:3000 -e DB_PATH=/data/users.db ride-hailing-user-service
```
