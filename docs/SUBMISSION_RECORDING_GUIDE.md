# Submission Recording Guide

This guide maps the current repository state to the assignment recording requirements.

## Architecture Source of Truth

Docker Compose integration uses the standalone backend service repositories as the source of truth:

- https://github.com/rajasekar21/ride-hailing-user-service
- https://github.com/rajasekar21/ride-hailing-driver-service
- https://github.com/rajasekar21/ride-hailing-trip-service
- https://github.com/rajasekar21/ride-hailing-payment-service
- https://github.com/rajasekar21/ride-hailing-rating-service
- https://github.com/rajasekar21/ride-hailing-notification-service
- https://github.com/rajasekar21/ride-hailing-auth-service

The platform repo provides Docker Compose orchestration, frontend, Kubernetes manifests, monitoring config, docs, and evidence capture scripts.

## Recommended 10-15 Minute Video Flow

### 1. Intro: 1 minute

Show:

- Platform repo and standalone service repos.
- Services: auth, user, driver, ride/trip, payment, notification, rating, frontend.
- Core lifecycle: rider -> trip -> driver -> payment -> notification -> rating.

### 2. Docker Compose Setup: 2-3 minutes

Run:

```bash
git pull
./scripts/codespace-start.sh --reset --no-cache
./scripts/codespace-status.sh
docker compose ps
```

Show:

- All service containers are running.
- Health checks are OK.
- Frontend is available on port 5173.

### 3. Inter-Service Communication: 3-4 minutes

Run:

```bash
SKIP_DEPLOY=1 ./scripts/codespace-validate.sh
```

Show the final PASS lines proving:

- Rider creation.
- Driver creation.
- Auth login.
- Trip request.
- Inactive driver rejected.
- Active driver accepted.
- Trip completed and payment charged.
- Payment idempotency.
- Rating submitted.
- Notification log found.

### 4. Database Persistence: 2 minutes

Generate evidence:

```bash
./scripts/capture-compose-evidence.sh
```

Open the generated file under `docs/evidence/generated/` and show:

- Latest trip retrieved by `GET /v1/trips/{id}` after creation.
- Latest rider retrieved by `GET /v1/riders/{id}` after creation.

This is API-level proof that SQLite-backed data persisted in the running service.

Optional container-level proof:

```bash
docker compose exec ride ls -lh /data
docker compose exec user ls -lh /data
```

### 5. Minikube Deployment: 3-4 minutes

Use the command pack:

```bash
./scripts/minikube-recording-commands.sh
```

Record separate short clips for individual services. They do not all need to run simultaneously if the machine cannot handle it.

Show:

```bash
kubectl get pods -o wide
kubectl get svc
kubectl logs deployment/notification --since=10m
grep -RniE "readinessProbe|livenessProbe" k8s/*.yaml k8s/trip/*.yaml
```

Explain clearly whether the integration flow is being demonstrated on Docker Compose or Minikube. The current recommended integration demo is Docker Compose.

### 6. Monitoring and Logs: 2 minutes

Show:

```bash
curl http://localhost:3000/metrics
curl http://localhost:3003/metrics
curl http://localhost:3005/metrics
docker compose logs --tail=100 ride payment notification
```

Point out:

- `trips_requested_total`
- `trips_completed_total`
- `payment_payments_total`
- `avg_driver_rating`
- Correlation/request IDs in logs

### 7. Closing: 1 minute

Show:

- Platform repo URL.
- Standalone service repo URLs.
- Mention Docker Compose was used for full integration testing.
- Mention Minikube was used for individual deployment evidence.

## Screenshot Refresh Checklist

Refresh these screenshots from the current Codespace run:

- `docs/screenshots/evidence-docker-ps.png`
- `docs/screenshots/service-frontend-dashboard.png`
- `docs/screenshots/evidence-api-create-rider.png`
- `docs/screenshots/evidence-api-create-driver.png`
- `docs/screenshots/evidence-api-create-trip.png`
- `docs/screenshots/evidence-api-accept-trip.png`
- `docs/screenshots/evidence-api-complete-trip.png`
- `docs/screenshots/evidence-api-rating-final-step.png`
- `docs/screenshots/evidence-metrics-ride.png`
- `docs/screenshots/evidence-metrics-payment.png`
- `docs/screenshots/evidence-metrics-rating.png`
- `docs/screenshots/evidence-logs-notification-json.png`
- `docs/screenshots/evidence-kubectl-get-pods.png`
- `docs/screenshots/evidence-kubectl-get-svc.png`
- `docs/screenshots/evidence-k8s-probes-check.png`

## Final Sanity Commands

Before recording:

```bash
./scripts/codespace-status.sh
SKIP_DEPLOY=1 ./scripts/codespace-validate.sh
./scripts/capture-compose-evidence.sh
```
