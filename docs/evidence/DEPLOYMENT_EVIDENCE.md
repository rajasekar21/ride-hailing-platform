# Deployment Evidence Log

Use this file to capture command outputs and map them to screenshots for final submission.

Current Docker Compose integration builds backend services from the standalone service repositories. The platform repo provides orchestration, frontend, monitoring, Kubernetes manifests, and evidence scripts.

Minikube is mandatory for the final project demonstration. Use `./scripts/run-all.sh` as the primary execution path. Docker Compose evidence can be kept as secondary Codespace validation evidence.

For the final recording sequence, use `docs/SUBMISSION_RECORDING_GUIDE.md`.

## 1) Docker Evidence

Command:

```bash
docker compose ps
./scripts/codespace-status.sh
SKIP_DEPLOY=1 ./scripts/codespace-validate.sh
```

Screenshot:

- `docs/screenshots/evidence-docker-ps.png`
- `docs/screenshots/service-frontend-dashboard.png`

Paste key output summary:

- Ride-hailing containers are running and mapped on host ports:
  - `ride` -> `3000`
  - `user` -> `3001`
  - `driver` -> `3002`
  - `payment` -> `3003`
  - `notification` -> `3004`
  - `rating` -> `3005`
  - `auth` -> `3006`
  - `frontend` -> `5173`
- Supporting infra containers are up:
  - `rabbitmq`
  - `prometheus`
  - `grafana`
- `codespace-status.sh` reports OK for ride, user, driver, payment, notification, rating, auth, frontend, prometheus, and grafana.
- `codespace-validate.sh` passes the full rider -> trip -> driver -> payment -> notification -> rating lifecycle.

Exact screenshot mapping:

- `docs/screenshots/evidence-docker-ps.png` -> `docker ps`
- `docs/screenshots/service-user-health.png` -> `curl http://localhost:3001/health`
- `docs/screenshots/service-driver-health.png` -> `curl http://localhost:3002/health`
- `docs/screenshots/service-ride-health.png` -> `curl http://localhost:3000/health`
- `docs/screenshots/service-payment-health.png` -> `curl http://localhost:3003/health`
- `docs/screenshots/service-notification-health.png` -> `curl http://localhost:3004/health`
- `docs/screenshots/service-rating-health.png` -> `curl http://localhost:3005/health`
- `docs/screenshots/service-auth-health.png` -> `curl http://localhost:3006/health`
- `docs/screenshots/service-frontend-dashboard.png` -> frontend dashboard with no "Some services are unavailable" warning after hard refresh

Generated text evidence:

```bash
./scripts/capture-compose-evidence.sh
```

Save or screenshot the generated file under `docs/evidence/generated/`. It captures `docker compose ps`, health checks, full validation, metrics, notification logs, and persisted-data proof.

## 2) Kubernetes Evidence

Commands:

```bash
./scripts/run-all.sh
minikube status
./scripts/minikube-recording-commands.sh
kubectl get pods
kubectl get svc
rg -n "readinessProbe|livenessProbe" k8s/*.yaml k8s/trip/*.yaml
```

Screenshots:

- `docs/screenshots/evidence-run-all.png`
- `docs/screenshots/evidence-minikube-status.png`
- `docs/screenshots/evidence-kubectl-get-pods.png`
- `docs/screenshots/evidence-kubectl-get-svc.png`
- `docs/screenshots/evidence-k8s-probes-check.png`

Paste key output summary:

- Pods ready (`1/1 Running`) for all required services:
  - `auth`, `user`, `ride`, `driver`, `payment`, `notification`, `rating`, `rabbitmq`
- Service exposure verified:
  - NodePort: `user (30301)`, `ride (30300)`, `auth (30302)`
  - Extra NodePort services: `driver-nodeport`, `payment-nodeport`, `rating-nodeport`
  - ClusterIP internals: `driver`, `payment`, `rating`, `notification`, `rabbitmq`
- Record individual Minikube clips per service when machine resources are limited. For each clip, show pod, service, `/health`, and logs for that service.

## 3) API Response Evidence (Trip to Rating Flow)

Capture screenshots for each step:

- `docs/screenshots/evidence-api-create-rider.png`
- `docs/screenshots/evidence-api-create-driver.png`
- `docs/screenshots/evidence-api-create-trip.png`
- `docs/screenshots/evidence-api-accept-trip.png`
- `docs/screenshots/evidence-api-complete-trip.png`
- `docs/screenshots/evidence-api-rating-final-step.png`

Notes:

- Ensure rating is shown as the final business step.
- Show successful status/response body in each screenshot.
- Verified sample run from local service endpoints:
  - Rider created with `id: 91`
  - Trip created with `id: 356`, status `REQUESTED`
  - Trip accepted with `driver_id: 2`, status `ACCEPTED`
  - Async complete returned `payment.status: PROCESSING`, trip status `COMPLETED`
  - Follow-up trip read showed `payment_status: PAID`
  - Final rating created: `rating: 5` for `trip_id: 356`

Sample text responses (reviewer-friendly, not image-only):

```bash
# Create rider
curl -X POST http://localhost:3001/v1/riders -H "Content-Type: application/json" -d '{"name":"Demo Rider","email":"demo.rider@example.com","phone":"9000000010","city":"Bangalore"}'
# -> {"id":3,"name":"Demo Rider","email":"demo.rider@example.com", ...}

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

## 4) Metrics and Logs Evidence

Screenshots:

- `docs/screenshots/evidence-metrics-ride.png`
- `docs/screenshots/evidence-metrics-payment.png`
- `docs/screenshots/evidence-metrics-rating.png`
- `docs/screenshots/evidence-logs-notification-json.png`

Recommended commands:

```bash
curl http://localhost:3000/metrics
curl http://localhost:3003/metrics
curl http://localhost:3005/metrics
kubectl logs deployment/notification --since=10m
```

Paste key metric lines:

- `trips_requested_total`
- `trips_completed_total`
- `payments_failed_total`
- `avg_driver_rating`
- `event_publish_failures_total`

Log evidence command:

```bash
kubectl logs deployment/notification --since=10m
```

Tip:

- While taking screenshots, keep terminal zoom at 125% and include the exact metric lines above.

## 5) DB Persisted Data Evidence

Use the generated Compose evidence file after a successful validation run:

```bash
./scripts/capture-compose-evidence.sh
```

Required proof:

- Latest rider retrieved with `GET /v1/riders/{id}` after creation.
- Latest trip retrieved with `GET /v1/trips/{id}` after creation and completion.

Optional container-level proof:

```bash
docker compose exec user ls -lh /data
docker compose exec ride ls -lh /data
```

## 6) Verified Kubernetes E2E Run (Latest)

This section records one full run executed on Minikube service URLs.

### Service URLs used in run

- Frontend: `http://localhost:5173`
- User: `http://127.0.0.1:54098`
- Ride: `http://127.0.0.1:54096`
- Driver: `http://127.0.0.1:54099`
- Payment: `http://127.0.0.1:54101`
- Rating: `http://127.0.0.1:54097`
- Auth: `http://127.0.0.1:54100`

### Flow summary (request -> accept -> complete -> payment -> rating)

- Rider created:
  - `id: 3`
  - `email: e2e1777392846@example.com`
- Driver created:
  - `id: 2846`
  - `is_active: true`
- Auth:
  - token received successfully from `/login`
- Trip created:
  - `id: 3`
  - `trip_status: REQUESTED`
- Trip accepted:
  - `trip_status: ACCEPTED`
  - `driver_id: 1`
- Trip completed:
  - `trip_status: COMPLETED`
  - `fare_amount: 120`
  - payment response `status: PAID`
- Final trip check:
  - `trip_status: COMPLETED`
  - `payment_status: PAID`
- Rating submitted (final business step):
  - `trip_id: 3`
  - `rating: 5`

### Command evidence snippets to capture screenshots

```bash
# Frontend availability
curl -I http://localhost:5173

# Kubernetes service tunnels (Windows + Minikube Docker driver)
minikube service user --url
minikube service ride --url
minikube service driver-nodeport --url
minikube service payment-nodeport --url
minikube service rating-nodeport --url
minikube service auth --url
```

Screenshot mapping for this run:

- `docs/screenshots/evidence-api-create-rider.png` -> rider create response with `id: 3`
- `docs/screenshots/evidence-api-create-driver.png` -> driver create response with `id: 2846`
- `docs/screenshots/evidence-api-create-trip.png` -> trip create `REQUESTED`
- `docs/screenshots/evidence-api-accept-trip.png` -> trip `ACCEPTED`
- `docs/screenshots/evidence-api-complete-trip.png` -> trip `COMPLETED` + payment `PAID`
- `docs/screenshots/evidence-api-rating-final-step.png` -> rating saved with `rating: 5`
