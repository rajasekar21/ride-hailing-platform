# 🚀 Ride Hailing Microservices Platform

A **cloud-native, event-driven ride-hailing backend system** built using **Node.js, Docker, and Kubernetes (Minikube)** with real dataset integration, autoscaling, and a live dashboard.

---

# 🧱 Architecture Overview

This system follows a **microservices architecture** with:

* Independent services (loosely coupled)
* Database-per-service (SQLite)
* Event-driven communication (RabbitMQ)
* Containerized deployment (Docker)
* Orchestration (Kubernetes - Minikube)

🔄 Flow

User → Ride → Driver → Payment → Notification → Rating


# 🧩 System Components

## 🔹 Backend Microservices

* **User Service** → Manages riders
* **Driver Service** → Handles driver allocation
* **Ride Service** → Ride lifecycle management
* **Payment Service** → Payment processing
* **Rating Service** → Post-trip ratings
* **Notification Service** → Event notifications
* **Auth Service** → JWT-based authentication

## 🔗 Standalone Service Repositories

* **Platform Orchestration Repo**: [ride-hailing-platform](https://github.com/rajasekar21/ride-hailing-platform)
* **User Service Repo**: [ride-hailing-user-service](https://github.com/rajasekar21/ride-hailing-user-service)
* **Driver Service Repo**: [ride-hailing-driver-service](https://github.com/rajasekar21/ride-hailing-driver-service)
* **Trip Service Repo**: [ride-hailing-trip-service](https://github.com/rajasekar21/ride-hailing-trip-service)
* **Payment Service Repo**: [ride-hailing-payment-service](https://github.com/rajasekar21/ride-hailing-payment-service)
* **Rating Service Repo**: [ride-hailing-rating-service](https://github.com/rajasekar21/ride-hailing-rating-service)
* **Notification Service Repo**: [ride-hailing-notification-service](https://github.com/rajasekar21/ride-hailing-notification-service)
* **Auth Service Repo**: [ride-hailing-auth-service](https://github.com/rajasekar21/ride-hailing-auth-service)

---

## 🔹 Infrastructure

* **Message Broker** → RabbitMQ
* **Cache Layer** → Redis
* **Database** → SQLite (per service)
* **API Gateway** → Nginx (optional)

SQLite deployment note:

- Each SQLite-backed microservice runs as single replica in Kubernetes manifests to avoid DB-file multi-writer conflicts.
- This is a deliberate assignment trade-off; for production multi-replica writes, a networked DB engine (PostgreSQL/MySQL) would be preferred.

---

## 🔹 Frontend

* React Dashboard
* Live ride booking simulation
* Analytics (rides, revenue, metrics)
* Map-based visualization (Leaflet)

---

# 🔁 Event-Driven Workflow

1. Ride created → `ride_queue`
2. Driver assigned → `payment_queue`
3. Payment processed → `notification_queue`
4. Notification triggered

---

# 📊 Dataset Integration

The system uses **real CSV datasets** for realistic simulation.

## 📁 Dataset Structure

```
dataset/
├── users.csv
├── drivers.csv
├── rides.csv
├── payments.csv
├── ratings.csv
```

## ⚙️ Seeding Data

Services load data into SQLite with their seed scripts.

```bash
./scripts/seed.sh
```

This includes:
- `services/user/seed.js` → riders
- `services/driver/seed.js` → drivers
- `services/ride/seed.js` → trips
- `services/payment/seed.js` → payments
- `services/rating/seed.js` → ratings

---

# ⚙️ Tech Stack

| Layer         | Technology            |
| ------------- | --------------------- |
| Backend       | Node.js (Express)     |
| Frontend      | React                 |
| Database      | SQLite                |
| Messaging     | RabbitMQ              |
| Cache         | Redis                 |
| Container     | Docker                |
| Orchestration | Kubernetes (Minikube) |

---
## 🚀 Run Project

```bash
./scripts/run-all.sh

---
# 🚀 Setup Instructions

## 🔧 Prerequisites

Install:

* Node.js (v18+)
* Docker
* Minikube
* kubectl
* Git

---

## 🟢 Step 1: Start Minikube

```bash
minikube start --memory=4096 --cpus=2
minikube addons enable metrics-server
eval $(minikube docker-env)
```

---

## 🐳 Step 2: Build Docker Images

```bash
docker build -t user ./services/user
docker build -t ride ./services/ride
docker build -t driver ./services/driver
docker build -t payment ./services/payment
docker build -t notification ./services/notification
docker build -t rating ./services/rating
docker build -t auth ./services/auth
docker build -t frontend ./frontend
```

---

## ☸️ Step 3: Deploy to Kubernetes

```bash
kubectl apply -f k8s/
```

### Trip Template (Reference Manifests)

A production-style reference template for the Trip service is available in:

- `k8s/trip/`

Apply only the Trip template with kustomize:

```bash
kubectl apply -k k8s/trip
```

This deploys all services including:
- **auth.yaml** — Auth service with JWT_SECRET Kubernetes Secret
- **user.yaml** — User service
- **ride.yaml** — Ride service
- **driver.yaml** — Driver service
- **payment.yaml** — Payment service
- **notification.yaml** — Notification service
- **rating.yaml** — Rating service
- **rabbitmq.yaml** — Message broker

**Note:** The Auth service deployment automatically configures the JWT_SECRET from the Kubernetes Secret defined in `k8s/auth.yaml`.

---

## 📊 Step 4: Verify Deployment

```bash
kubectl get pods
kubectl get svc
kubectl wait --for=condition=ready pod --all --timeout=240s
```

---

## 🌐 Step 5: Access Application

```bash
minikube ip
```

* Frontend → `http://<IP>:30010`
* API (Rides) → `http://<IP>:30000`
* Auth Service → `http://<IP>:30302`

> If you are using GitHub.dev or a remote editor preview, the frontend now binds to `0.0.0.0` and is available on port `5173`.
> Use the editor preview URL for port `5173` instead of `3000` for the frontend.

---

## ✅ Verified Kubernetes Execution (Windows + Minikube Docker Driver)

The following flow has been executed and validated on this repository.

### 1) Start cluster and deploy

```bash
minikube start --driver=docker --memory=4096 --cpus=2
kubectl apply -f k8s/
kubectl wait --for=condition=ready pod --all --timeout=240s
kubectl get pods -o wide
kubectl get svc
```

### 2) Load local images into Minikube cache

If images are built as `ride-hailing-platform-*`, tag and load:

```bash
docker tag ride-hailing-platform-user:latest user:latest
docker tag ride-hailing-platform-driver:latest driver:latest
docker tag ride-hailing-platform-ride:latest ride:latest
docker tag ride-hailing-platform-payment:latest payment:latest
docker tag ride-hailing-platform-notification:latest notification:latest
docker tag ride-hailing-platform-rating:latest rating:latest
docker tag ride-hailing-platform-auth:latest auth:latest
minikube image load user:latest driver:latest ride:latest payment:latest notification:latest rating:latest auth:latest
```

### 3) Windows note for NodePort access

With Minikube Docker driver on Windows, direct `<minikube-ip>:<nodePort>` access may fail from host shell.
Use service tunnels:

```bash
minikube service user --url
minikube service ride --url
minikube service driver-nodeport --url
minikube service payment-nodeport --url
minikube service rating-nodeport --url
```

Example validated URLs in one run:

- User: `http://127.0.0.1:57588`
- Ride: `http://127.0.0.1:57608`
- Driver: `http://127.0.0.1:51987`
- Payment: `http://127.0.0.1:57610`
- Rating: `http://127.0.0.1:57612`

### 4) End-to-end assignment flow (rating as final step)

1. Create rider (`POST /v1/riders`)
2. Create/activate driver (`POST /v1/drivers`)
3. Create trip (`POST /v1/trips`)
4. Accept trip (`POST /v1/trips/{id}/accept`)
5. Complete trip async (`POST /v1/trips/{id}/complete?mode=async`)
6. Verify trip payment status becomes `PAID` via ride service
7. Submit rating (`POST /v1/trips/{id}/rating`) as final business step
8. Capture metrics from ride/payment/rating services

### 5) Verified sample outcomes

- Trip lifecycle reached `REQUESTED -> ACCEPTED -> COMPLETED`
- Ride payment status moved `PROCESSING -> PAID`
- Rating successfully saved with value `5`
- Notification service consumed `payment.completed` event

### 6) Metrics captured after flow

```json
{
  "ride_metrics": {
    "trips_requested_total": 2,
    "trips_completed_total": 1,
    "completed_trips_in_db": 1,
    "event_publish_failures_total": 0
  },
  "payment_metrics": {
    "payments_failed_total": 0,
    "payments_total": 1,
    "refunded_total": 0,
    "payment_events_consumed_total": 1,
    "payment_event_consumer_errors_total": 0
  },
  "rating_metrics": {
    "avg_driver_rating": 5,
    "ratings_total": 1
  }
}
```

---

# 📚 Documentation Artifacts

To address submission feedback gaps, a dedicated docs pack is now added:

- `docs/README.md`
- `docs/api/API_DOCUMENTATION.md` (Postman/OpenAPI guidance)
- `docs/api/postman_collection.json` (ready-to-import Postman v2.1 collection)
- `docs/architecture/ER_DATA_MODEL.md` (data model + ER diagram placeholder)
- `docs/architecture/ER_DIAGRAM.md` (Mermaid ER diagram source)
- `docs/evidence/DEPLOYMENT_EVIDENCE.md` (docker/k8s/api/metrics evidence checklist)
- `docs/screenshots/README.md` (service/evidence screenshot naming checklist)
- `docs/api/openapi.json` (auto-generated OpenAPI spec from service route code)
- `.github/workflows/openapi-verify.yml` (CI check that verifies the spec is regenerated from code)

Store all service and evidence screenshots under:

- `docs/screenshots/`

Reviewer note: plain-text ER entity/relationship summary is included in `docs/architecture/ER_DATA_MODEL.md` (not diagram-only).

---

## OpenAPI/Swagger (Code-Generated Proof)

This repository includes an auto-generated OpenAPI spec created from service route code.

- Generator script: `docs/api/generate-openapi.js`
- NPM command: `cd docs/api && npm run generate:openapi`
- Generated spec file: `docs/api/openapi.json`
- CI verification: `.github/workflows/openapi-verify.yml` (fails if regenerated spec differs)

Quick verifier commands:

```bash
cd docs/api
npm ci
npm run generate:openapi
git diff -- docs/api/openapi.json
```

If `git diff` is empty, the committed spec is fully in sync with route code.

---

## Prometheus/Grafana Scrape Config (Proof)

Prometheus/Grafana monitoring is wired through checked-in config:

- Prometheus scrape config file: `monitoring/prometheus.yml`
- Docker Compose mounts this config into Prometheus: `docker-compose.yml`
- Grafana runs as `grafana` service and uses Prometheus as datasource target.

Current scrape jobs in `monitoring/prometheus.yml` include:

- `user-service`
- `driver-service`
- `ride-service`
- `payment-service`
- `rating-service`
- `notification-service`
- `auth-service`

Verification commands:

```bash
docker compose up -d prometheus grafana
curl http://localhost:9090/api/v1/targets
curl http://localhost:9090/api/v1/status/config
```

---

## Evidence

Capture these screenshots and paste outputs into your final PDF/report.

### Docker

- Screenshot: `docker ps` output table with all ride-hailing containers visible.
- Screenshot: health checks for all services:
  - `curl http://localhost:3001/health` (user)
  - `curl http://localhost:3002/health` (driver)
  - `curl http://localhost:3000/health` (trip/ride)
  - `curl http://localhost:3003/health` (payment)
  - `curl http://localhost:3004/health` (notification)
  - `curl http://localhost:3005/health` (rating)
  - `curl http://localhost:3006/health` (auth)

Committed image mapping:

- `docs/screenshots/evidence-docker-ps.png` -> `docker ps`
- `docs/screenshots/service-user-health.png` -> `curl http://localhost:3001/health`
- `docs/screenshots/service-driver-health.png` -> `curl http://localhost:3002/health`
- `docs/screenshots/service-ride-health.png` -> `curl http://localhost:3000/health`
- `docs/screenshots/service-payment-health.png` -> `curl http://localhost:3003/health`
- `docs/screenshots/service-notification-health.png` -> `curl http://localhost:3004/health`
- `docs/screenshots/service-rating-health.png` -> `curl http://localhost:3005/health`
- `docs/screenshots/service-auth-health.png` -> `curl http://localhost:3006/health`

### Kubernetes

- Screenshot: `kubectl get pods`
- Screenshot: `kubectl get svc`
- Screenshot: `kubectl get pvc`
- Screenshot: `kubectl get hpa`
- Screenshot: `rg -n "readinessProbe|livenessProbe" k8s/*.yaml k8s/trip/*.yaml` (probe coverage proof)

Committed image mapping:

- `docs/screenshots/evidence-kubectl-get-pods.png` -> `kubectl get pods`
- `docs/screenshots/evidence-kubectl-get-svc.png` -> `kubectl get svc`
- `docs/screenshots/evidence-k8s-probes-check.png` -> probe grep output across manifests

### End-to-End Flow

Run and screenshot each command with response body visible:

```bash
# 1) Create rider
curl -X POST http://localhost:3001/v1/riders -H "Content-Type: application/json" -d '{"name":"Demo Rider","email":"demo.rider@example.com","phone":"9000000010","city":"Bangalore","password":"demo@123","role":"rider"}'

# 2) Create driver
curl -X POST http://localhost:3002/v1/drivers -H "Content-Type: application/json" -d '{"id":2201,"name":"Demo Driver","phone":"9111111110","email":"demo.driver@example.com","vehicle_type":"Sedan","vehicle_plate":"KA01ZZ2201","is_active":true,"city":"Bangalore","password":"demo@123","role":"driver"}'

# 3) Create trip
curl -X POST http://localhost:3000/v1/trips -H "Content-Type: application/json" -d '{"rider_id":3,"pickup_location":"BTM","drop_location":"HSR","city":"Bangalore","distance_km":8}'

# 4) Accept trip
curl -X POST http://localhost:3000/v1/trips/3/accept -H "Content-Type: application/json" -d '{"driver_id":2201}'

# 5) Complete trip
curl -X POST http://localhost:3000/v1/trips/3/complete
```

Expected annotations in screenshots:

- Trip state transitions: `REQUESTED -> ACCEPTED -> COMPLETED`
- Payment status shown as `COMPLETED` or equivalent paid state
- Fare amount visible in trip/payment response

Sample request/response evidence (text, not image-only):

```bash
# Create rider
curl -X POST http://localhost:3001/v1/riders -H "Content-Type: application/json" -d '{"name":"Demo Rider","email":"demo.rider@example.com","phone":"9000000010","city":"Bangalore"}'
# -> {"id":3,"name":"Demo Rider","email":"demo.rider@example.com","phone":"9000000010","city":"Bangalore", ...}

# Create driver
curl -X POST http://localhost:3002/v1/drivers -H "Content-Type: application/json" -d '{"id":2201,"name":"Demo Driver","phone":"9111111110","email":"demo.driver@example.com","vehicle_type":"Sedan","vehicle_plate":"KA01ZZ2201","is_active":true,"city":"Bangalore"}'
# -> {"id":2201,"is_active":true, ...}

# Create trip
curl -X POST http://localhost:3000/v1/trips -H "Content-Type: application/json" -d '{"rider_id":3,"pickup_location":"BTM","drop_location":"HSR","city":"Bangalore","distance_km":8}'
# -> {"id":3,"trip_status":"REQUESTED", ...}

# Accept trip
curl -X POST http://localhost:3000/v1/trips/3/accept -H "Content-Type: application/json" -d '{"driver_id":2201}'
# -> {"id":3,"trip_status":"ACCEPTED","driver_id":2201, ...}

# Complete trip
curl -X POST http://localhost:3000/v1/trips/3/complete
# -> {"trip":{"id":3,"trip_status":"COMPLETED","payment_status":"PAID","fare_amount":120}, ...}
```

### Metrics

- Screenshot command and snippet:
  - `curl http://localhost:3003/metrics`
- Ensure visible lines include these four named metrics:
  - `trips_requested_total`
  - `trips_completed_total`
  - `payments_failed_total`
  - `avg_driver_rating`

### Logs

- Screenshot:
  - `kubectl logs <trip-pod-name>`
- Ensure one visible log line is structured JSON and clearly includes:
  - `correlationId`
  - `method`
  - `path`
  - `statusCode`
  - `durationMs`

Committed log evidence mapping:

- `docs/screenshots/evidence-logs-notification-json.png` -> `kubectl logs deployment/notification --since=10m` (fallback `docker logs notification --tail 120`)

---

# 🧪 API Endpoints

## User Service

* `GET /v1/riders`
* `GET /v1/riders/{id}`
* `POST /v1/riders`
* `PUT /v1/riders/{id}`
* `DELETE /v1/riders/{id}`

## Driver Service

* `GET /v1/drivers`
* `GET /v1/drivers/{id}`
* `POST /v1/drivers`
* `PATCH /v1/drivers/{id}/status`

## Trip Service

* `POST /v1/trips`
* `GET /v1/trips`
* `GET /v1/trips/{id}`
* `POST /v1/trips/{id}/accept`
* `POST /v1/trips/{id}/complete`
* `POST /v1/trips/{id}/complete?mode=async` (publishes event to RabbitMQ)
* `POST /v1/trips/{id}/cancel`

## Payment Service

* `POST /v1/payments/charge`
* `GET /v1/payments/{id}`
* `POST /v1/payments/{id}/refund`

## Rating Service

* `POST /v1/trips/{id}/rating`
* `GET /v1/ratings`
* `GET /v1/ratings/trip/{tripId}`

## Notification Service

* `POST /v1/notifications`
* `GET /metrics`

## Distributed Trace Header

All services accept and propagate:

* `X-Request-ID`
* `X-Trace-ID`

## Auth Service

* `POST /login` - Authenticate user and return JWT token
* `GET /health` - Health check endpoint

---

# 📈 Autoscaling (HPA)

## Enable Autoscaling

```bash
kubectl autoscale deployment ride \
  --cpu-percent=50 \
  --min=1 \
  --max=5
```

## Generate Load

```bash
while true; do curl -X POST http://<IP>:30000/v1/trips; done
```

## Monitor

```bash
kubectl get hpa
kubectl get pods -w
```

---

# 📊 Monitoring & Metrics

Each service exposes:

```bash
GET /metrics
```

Example:

```text
# HELP trips_requested_total Total number of trips requested
# TYPE trips_requested_total counter
trips_requested_total 5

# HELP trips_completed_total Total number of trips completed
# TYPE trips_completed_total counter
trips_completed_total 3

# HELP payments_failed_total Total number of failed payment operations
# TYPE payments_failed_total counter
payments_failed_total 0

# HELP avg_driver_rating Rolling average of driver ratings
# TYPE avg_driver_rating gauge
avg_driver_rating 4.8
```

---

# 🔐 Authentication

* JWT-based login
* Role-based access:

  * Admin
  * Driver
  * Rider

---

# 🔧 Environment Variables

Configure these environment variables for deployment:

| Service | Variable | Default | Description |
| --- | --- | --- | --- |
| Auth | `JWT_SECRET` | `your-secret-key-change-in-production` | Secret key for signing JWT tokens. **Must be set in production** |
| Frontend | `VITE_USER_BASE` | (required) | Base URL for User Service API |
| Frontend | `VITE_API_BASE` | (required) | Base URL for Ride Service API |

Example `.env` for Docker/K8s:

```bash
JWT_SECRET=your-secure-production-key-here
```

---

## Kubernetes Authentication Setup

The Auth Service requires a Kubernetes Secret to store the `JWT_SECRET`. This is configured in `k8s/auth.yaml`.

### Deploying Auth Service with JWT_SECRET

**1. Apply the auth service manifest:**

```bash
kubectl apply -f k8s/auth.yaml
```

This creates:
- **Deployment** — Auth service pod
- **Service** — NodePort on port 30302
- **Secret** — Stores JWT_SECRET safely

**2. Verify the deployment:**

```bash
kubectl get deployment auth
kubectl get svc auth
kubectl get secret auth-secret
```

**3. Change JWT_SECRET (if needed):**

Edit the secret directly:
```bash
kubectl edit secret auth-secret
```

Or create a new one:
```bash
kubectl create secret generic auth-secret \
  --from-literal=jwt-secret="your-new-secret-key" \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart the auth service pod to use the new secret
kubectl rollout restart deployment/auth
```

**4. Access the Auth Service:**

```bash
# Get Minikube IP
minikube ip

# Login endpoint
curl -X POST http://<MINIKUBE_IP>:30302/login \
  -H "Content-Type: application/json" \
  -d '{"u":"username"}'
```

---

# 🎨 Frontend Features

* Ride booking
* User management
* Revenue analytics
* Real-time map simulation
* System health indicators

---

# 🧪 Demo Flow

1. Start system (Minikube)
2. Open dashboard
3. Create rider and driver
4. Book trip
5. Accept and complete trip (`/complete?mode=async`)
6. Confirm payment status update from ride service
7. Submit rating as final step
8. Observe logs:

   ```bash
   kubectl logs deployment/ride --since=10m
   kubectl logs <payment-pod>
   kubectl logs deployment/notification --since=10m
   kubectl logs deployment/rating --since=10m
   ```
9. Show metrics:

   ```bash
   curl http://localhost:3000/metrics
   curl http://localhost:3003/metrics
   curl http://localhost:3005/metrics
   ```

---

# 🧠 Key Concepts Demonstrated

* Microservices architecture
* Event-driven design
* Container orchestration
* Horizontal scaling (HPA)
* Distributed data management
* Real-time simulation

---

## Code Verification (Evaluator Quick Check)

To make rubric verification immediate, use these copy-paste checks against source files.

### Rule 1: Fare formula + surge values (Trip Service)

Source file: `services/ride/app.js`

Verifier commands:

```bash
rg -n "function calculateFare|ratePerKm|baseFare|surgeOptions|randomSurge|surge_multiplier|Math.round" services/ride/app.js
```

What to confirm in code:

- `surgeOptions = [1.0, 1.2, 1.5]`
- Fare function uses:
  - `baseFare + distance * ratePerKm * surge`
- Constants used in completion path:
  - `ratePerKm = 12`
  - base fare passed as `20`
- Rounding to 2 decimals:
  - `Math.round(... * 100) / 100`

### Rule 2: Active-driver enforcement before accept (Trip Service)

Source file: `services/ride/app.js`

Verifier commands:

```bash
rg -n "v1/trips/:id/accept|/v1/drivers/\\$\\{driver_id\\}|is_active|Driver is not active|status\\(422\\)" services/ride/app.js
```

What to confirm in code:

- Accept endpoint checks driver via driver service API.
- Guard condition rejects inactive driver.
- Error response is `422` with `"Driver is not active"`.

### Rule 3: Payment idempotency + rate limiting (Payment Service)

Source file: `services/payment/index.js`
Readable source excerpt artifact: `docs/evidence/PAYMENT_SOURCE_VERIFICATION.md`

Verifier commands:

```bash
rg -n "rateLimit|chargeRateLimiter|max:\\s*10|windowMs|Idempotency-Key|idempotency_keys|CREATE TABLE IF NOT EXISTS idempotency_keys|/payments/charge|429|Too many requests" services/payment/index.js
```

What to confirm in code:

- `POST /v1/payments/charge` reads `Idempotency-Key` header.
- Missing key returns `400` with `"Idempotency-Key header required"`.
- `idempotency_keys` SQLite table exists and stores serialized response.
- Duplicate key path returns stored response (no reprocessing).
- Rate limiter wraps charge endpoint with:
  - `max: 10` per minute
  - `429` + `"Too many requests"` message.

This section is intentionally source-first so evaluators can verify implementation directly from code, not only from screenshots/demo.

---

# ⚠️ Troubleshooting

## Pods not starting

```bash
kubectl describe pod <pod-name>
```

## Logs

```bash
kubectl logs <pod-name>
```

## Frontend overlap or warning panel issues

- If heading/subtitle overlap appears, pull the latest frontend updates and rebuild the frontend image/container.
- The dashboard now auto-refreshes every 10s and clears transient startup warnings once services recover.

## Payment metrics shows `Network Error` in dashboard

This usually means the payment service is not reachable from frontend.

Quick checks:

```bash
curl http://localhost:3003/health
curl http://localhost:3003/metrics
docker compose ps
docker compose logs payment --tail 120
```

If payment container fails with `Cannot find module 'csv-parser'`, rebuild payment:

```bash
cd services/payment
npm install csv-parser
cd ../..
docker compose up -d --build payment
```

## Restart cluster

```bash
minikube delete
minikube start
```

---

# 📂 Repository Structure

```
ride-hailing-platform/
├── services/
├── frontend/
├── k8s/
├── dataset/
├── scripts/
└── README.md
```

---

# 🚀 Future Enhancements

* WebSockets for live tracking
* UPI payment simulation
* Prometheus + Grafana integration
* Cloud deployment (AWS/GCP)
* CI/CD pipeline automation

---

# 👨‍💻 Author

**Team-26**

---

# 🏁 Conclusion

This project demonstrates a **production-style ride-hailing platform** using modern cloud-native technologies, emphasizing scalability, modularity, and real-world system design principles.

