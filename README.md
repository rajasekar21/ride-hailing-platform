# Ride Hailing Microservices Platform

Cloud-native ride-hailing platform built with Node.js microservices, SQLite database-per-service, Docker, and Kubernetes (Minikube).  
The repository is structured for assignment evaluation with code, deployment manifests, API artifacts, and screenshot/video evidence.

## System Overview

Core flow:

`Rider -> Trip -> Driver -> Payment -> Notification -> Rating`

Implemented services:

- `services/user` (rider management)
- `services/driver` (driver onboarding + active state)
- `services/ride` (trip lifecycle + fare + orchestration)
- `services/payment` (charge/refund, idempotency, rate limiting)
- `services/notification` (event consumption + logs)
- `services/rating` (post-trip rating)
- `services/auth` (JWT login)

Deployment source of truth:

- Docker Compose builds backend services from the standalone service repositories listed below.
- The in-repo `services/*` folders are retained as reference copies for assignment review, but cloud deployment should use the standalone repositories.
- Current submission recording steps are in `docs/SUBMISSION_RECORDING_GUIDE.md`.

## Architecture & Data Design

- Microservices architecture with loose coupling.
- Database-per-service pattern (SQLite per service).
- Inter-service communication:
  - synchronous HTTP (`axios`)
  - asynchronous events (RabbitMQ via `amqplib`)

SQLite note:

- SQLite is used intentionally for assignment simplicity.
- SQLite-backed deployments remain single-replica to avoid DB-file multi-writer conflicts.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js, Express |
| Frontend | React (Vite) |
| Data | SQLite |
| Messaging | RabbitMQ |
| Containerization | Docker |
| Orchestration | Kubernetes (Minikube) |
| Monitoring | Prometheus, Grafana |

## Run Options

### Mandatory Minikube Run

Use this path for the final project demonstration:

```bash
./scripts/run-all.sh
minikube status
kubectl get pods -o wide
kubectl get svc
```

`run-all.sh` checks/installs required Linux CLI tools when possible, starts Minikube with the Docker driver, builds images into the Minikube Docker environment, applies manifests, starts port-forwards, starts the frontend, and runs validation.

Backend Minikube images are built from the standalone service repositories when `git` is available; the in-repo `services/*` folders are only fallback/reference copies.

### Docker Compose

Use this path for quick Codespace integration validation and secondary evidence:

```bash
docker compose up -d --build
```

Frontend:

- `http://localhost:5173`

### Kubernetes (Minikube)

```bash
minikube start --driver=docker --memory=4096 --cpus=2
kubectl apply -f k8s/
kubectl wait --for=condition=ready pod --all --timeout=240s
kubectl get pods
kubectl get svc
```

## API Versioning & Core Endpoints

All core routes are versioned under `/v1`.

- Riders: `GET/POST /v1/riders`, `GET/PUT/DELETE /v1/riders/{id}`
- Drivers: `GET/POST /v1/drivers`, `GET /v1/drivers/{id}`, `PATCH /v1/drivers/{id}/status`
- Trips: `POST/GET /v1/trips`, `GET /v1/trips/{id}`, `POST /v1/trips/{id}/accept|complete|cancel`
- Payments: `POST /v1/payments/charge`, `GET /v1/payments`, `GET /v1/payments/{id}`, `POST /v1/payments/{id}/refund`
- Rating: `POST /v1/trips/{id}/rating`, `GET /v1/ratings`, `GET /v1/ratings/trip/{tripId}`

## Required Business Rule Verification (Source-First)

### 1) Fare Formula + Surge

File: `services/ride/app.js`

```bash
rg -n "function calculateFare|surgeOptions|randomSurge|Math.round|ratePerKm|baseFare" services/ride/app.js
```

Expected:

- `surgeOptions = [1.0, 1.2, 1.5]`
- Fare formula uses `baseFare + distance * ratePerKm * surge`
- Rounded to 2 decimals (`Math.round(... * 100) / 100`)

### 2) Active Driver Enforcement Before Accept

File: `services/ride/app.js`

```bash
rg -n "v1/trips/:id/accept|is_active|Driver is not active|status\\(422\\)" services/ride/app.js
```

Expected:

- Driver active state is checked before accept.
- Inactive driver returns `422` with `"Driver is not active"`.

### 3) Payment Idempotency + Rate Limiting

File: `services/payment/index.js`  
Readable excerpt: `docs/evidence/PAYMENT_SOURCE_VERIFICATION.md`

```bash
rg -n "Idempotency-Key|idempotency_keys|rateLimit|max:\\s*10|Too many requests|/payments/charge" services/payment/index.js
```

Expected:

- Missing `Idempotency-Key` -> `400`
- Duplicate key returns stored response (no reprocessing)
- `idempotency_keys` SQLite table present
- Rate limiter on charge endpoint: `10/min` per IP, `429` on exceed

## Monitoring, Metrics, and Logging

- Prometheus config: `monitoring/prometheus.yml`
- Compose wiring: `docker-compose.yml`
- Metrics endpoints: `GET /metrics` (Prometheus format)
- Required metrics covered:
  - `trips_requested_total`
  - `trips_completed_total`
  - `payments_failed_total`
  - `avg_driver_rating`
- Structured logs include correlation IDs (`x-correlation-id` propagation)

Verification:

```bash
curl http://localhost:3000/metrics
curl http://localhost:3003/metrics
curl http://localhost:3005/metrics
kubectl logs deployment/notification --since=10m
```

## Documentation Artifacts

Primary docs:

- `docs/README.md`
- `docs/SUBMISSION_RECORDING_GUIDE.md`
- `docs/api/API_DOCUMENTATION.md`
- `docs/api/postman_collection.json`
- `docs/api/openapi.json`
- `docs/architecture/ER_DIAGRAM.md`
- `docs/architecture/ER_DATA_MODEL.md`
- `docs/evidence/DEPLOYMENT_EVIDENCE.md`
- `docs/evidence/PAYMENT_SOURCE_VERIFICATION.md`
- `docs/screenshots/README.md`

OpenAPI generation proof:

- Generator script: `docs/api/generate-openapi.js`
- Command: `cd docs/api && npm run generate:openapi`
- CI check: `.github/workflows/openapi-verify.yml`

## Evidence Mapping

All evidence assets are under `docs/screenshots/`.
Generated command-output evidence from the live Docker Compose run is written under `docs/evidence/generated/`.

Examples:

- `evidence-docker-ps.png` -> `docker ps`
- `service-frontend-dashboard.png` -> frontend dashboard after hard refresh
- `evidence-kubectl-get-pods.png` -> `kubectl get pods`
- `evidence-kubectl-get-svc.png` -> `kubectl get svc`
- `evidence-k8s-probes-check.png` -> probe presence (`readinessProbe|livenessProbe`)
- `evidence-metrics-*.png` -> service metrics outputs
- `evidence-logs-notification-json.png` -> structured log proof
- `docs/evidence/generated/compose-evidence-*.md` -> Compose status, validation pass, metrics, logs, and persisted-data proof
- `videos/workflow-demo-playwright.webm` -> demo workflow video

## Standalone Service Repository Links

- Platform orchestration: [ride-hailing-platform](https://github.com/rajasekar21/ride-hailing-platform)
- User service: [ride-hailing-user-service](https://github.com/rajasekar21/ride-hailing-user-service)
- Driver service: [ride-hailing-driver-service](https://github.com/rajasekar21/ride-hailing-driver-service)
- Trip service: [ride-hailing-trip-service](https://github.com/rajasekar21/ride-hailing-trip-service)
- Payment service: [ride-hailing-payment-service](https://github.com/rajasekar21/ride-hailing-payment-service)
- Rating service: [ride-hailing-rating-service](https://github.com/rajasekar21/ride-hailing-rating-service)
- Notification service: [ride-hailing-notification-service](https://github.com/rajasekar21/ride-hailing-notification-service)
- Auth service: [ride-hailing-auth-service](https://github.com/rajasekar21/ride-hailing-auth-service)

