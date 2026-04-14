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
* API → `http://<IP>:30000`

---

# 🧪 API Endpoints

## User Service

* `GET /users`
* `POST /users`

## Ride Service

* `POST /rides`
* `GET /rides`

## Auth Service

* `POST /login`

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

