# Deployment Evidence Log

Use this file to capture command outputs and map them to screenshots for final submission.

## 1) Docker Evidence

Command:

```bash
docker ps
```

Screenshot:

- `docs/screenshots/evidence-docker-ps.png`

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

Exact screenshot mapping:

- `docs/screenshots/evidence-docker-ps.png` -> `docker ps`
- `docs/screenshots/service-user-health.png` -> `curl http://localhost:3001/health`
- `docs/screenshots/service-driver-health.png` -> `curl http://localhost:3002/health`
- `docs/screenshots/service-ride-health.png` -> `curl http://localhost:3000/health`
- `docs/screenshots/service-payment-health.png` -> `curl http://localhost:3003/health`
- `docs/screenshots/service-notification-health.png` -> `curl http://localhost:3004/health`
- `docs/screenshots/service-rating-health.png` -> `curl http://localhost:3005/health`
- `docs/screenshots/service-auth-health.png` -> `curl http://localhost:3006/health`

## 2) Kubernetes Evidence

Commands:

```bash
kubectl get pods
kubectl get svc
rg -n "readinessProbe|livenessProbe" k8s/*.yaml k8s/trip/*.yaml
```

Screenshots:

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
curl http://<ride-base>/metrics
curl http://<payment-base>/metrics
curl http://<rating-base>/metrics
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

## 5) Human Notes (Add Before Final Submission)

Use this section in your own words so evaluators can see genuine project work.

### What we changed during implementation

- Example: "Initially, payment metrics were split across two `/metrics` handlers, which made dashboard integration inconsistent. We unified metrics to one Prometheus endpoint."
- Example: "We updated seed schemas to include auth fields (`password`, `role`) so login and end-to-end flows work on fresh setup."

### Challenges we faced

- Challenge 1 (fill by team): `............................................................`
- Fix: `............................................................................`
- Challenge 2 (fill by team): `............................................................`
- Fix: `............................................................................`

### Why this design

- Explain why you used database-per-service.
- Explain why rating is kept as final business step.
- Explain why async completion path (`/complete?mode=async`) was important for the assignment.

### What we learned

- `............................................................................`
- `............................................................................`

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
