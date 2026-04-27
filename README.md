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

User → Ride → Driver → Payment → Notification


# 🧩 System Components

## 🔹 Backend Microservices

* **User Service** → Manages riders
* **Driver Service** → Handles driver allocation
* **Ride Service** → Ride lifecycle management
* **Payment Service** → Payment processing
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
```

## ⚙️ Seeding Data

Each service loads data into SQLite using:

```bash
node seed.js
```

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
- **rabbitmq.yaml** — Message broker

**Note:** The Auth service deployment automatically configures the JWT_SECRET from the Kubernetes Secret defined in `k8s/auth.yaml`.

---

## 📊 Step 4: Verify Deployment

```bash
kubectl get pods
kubectl get svc
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

# 🧪 API Endpoints

## User Service

* `GET /users`
* `POST /users`

## Ride Service

* `POST /rides`
* `GET /rides`

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
3. Create user
4. Book ride
5. Observe logs:

   ```bash
   kubectl logs <driver-pod>
   kubectl logs <payment-pod>
   ```
6. Trigger autoscaling
7. Show metrics

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

