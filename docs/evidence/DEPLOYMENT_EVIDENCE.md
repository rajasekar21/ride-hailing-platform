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

## 2) Kubernetes Evidence

Commands:

```bash
kubectl get pods -o wide
kubectl get svc
```

Screenshots:

- `docs/screenshots/evidence-kubectl-get-pods.png`
- `docs/screenshots/evidence-kubectl-get-svc.png`

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

## 4) Metrics and Logs Evidence

Screenshots:

- `docs/screenshots/evidence-metrics-ride.png`
- `docs/screenshots/evidence-metrics-payment.png`
- `docs/screenshots/evidence-metrics-rating.png`

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
