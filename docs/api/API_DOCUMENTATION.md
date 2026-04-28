# API Documentation

This document closes the API documentation gap called out in review feedback.

## Option A: Postman Collection (Recommended for submission)

Include:

- Collection file: `Ride-Hailing-Platform.postman_collection.json`
- Environment file: `Ride-Hailing-Platform.postman_environment.json`
- Variables: `user_base`, `driver_base`, `ride_base`, `payment_base`, `rating_base`, `auth_base`, `token`

Save exported files in this folder or provide links in your submission PDF.

## Option B: OpenAPI/Swagger

If generated, add:

- `openapi.yaml` or `openapi.json`
- Optional Swagger UI screenshot under `docs/screenshots/`

## Minimum Endpoint Coverage

### Auth

- `POST /login`

### User

- `GET /v1/riders`
- `GET /v1/riders/{id}`
- `POST /v1/riders`
- `PUT /v1/riders/{id}`
- `DELETE /v1/riders/{id}`

### Driver

- `GET /v1/drivers`
- `GET /v1/drivers/{id}`
- `POST /v1/drivers`
- `PATCH /v1/drivers/{id}/status`

### Ride

- `POST /v1/trips`
- `GET /v1/trips`
- `GET /v1/trips/{id}`
- `POST /v1/trips/{id}/accept`
- `POST /v1/trips/{id}/complete`
- `POST /v1/trips/{id}/complete?mode=async`
- `POST /v1/trips/{id}/cancel`

### Payment

- `POST /v1/payments/charge`
- `GET /v1/payments/{id}`
- `POST /v1/payments/{id}/refund`

### Rating

- `POST /v1/trips/{id}/rating`
- `GET /v1/ratings`
- `GET /v1/ratings/trip/{tripId}`

### Notification

- `POST /v1/notifications`
- `GET /metrics`

## Required Headers

- `Authorization: Bearer <jwt>`
- `X-Request-ID: <request-id>`
- `X-Trace-ID: <trace-id>`
