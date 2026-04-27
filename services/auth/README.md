# Auth Service

Provides JWT-based login for platform users.

## API
- `POST /login`
- `GET /health`

## Environment Variables
- `JWT_SECRET` (required in production)

## Run Locally
```bash
npm install
node app.js
```

## Docker
```bash
docker build -t ride-hailing-auth-service .
docker run -p 3006:3000 -e JWT_SECRET=change-me ride-hailing-auth-service
```
