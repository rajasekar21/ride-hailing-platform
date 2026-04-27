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

---

## 🔹 Infrastructure

* **Message Broker** → RabbitMQ
* **Cache Layer** → Redis
* **Database** → SQLite (per service)
* **API Gateway** → Nginx (optional)

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
while true; do curl -X POST http://<IP>:30000/rides; done
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

```json
{
  "cpu": 45.2,
  "memory": 60.1,
  "requests": 120
}
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
   curl http://<ride-base>/metrics
   curl http://<payment-base>/metrics
   curl http://<rating-base>/metrics
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

