# Screenshots Checklist

Add screenshots in this folder using the naming convention below.

## Service Screenshots

- `service-user-health.png`
- `service-driver-health.png`
- `service-ride-health.png`
- `service-payment-health.png`
- `service-notification-health.png`
- `service-rating-health.png`
- `service-auth-health.png`
- `service-frontend-dashboard.png`

## Evidence Screenshots

- `evidence-docker-ps.png`
- `evidence-kubectl-get-pods.png`
- `evidence-kubectl-get-svc.png`
- `evidence-k8s-probes-check.png` (readiness/liveness presence across manifests)
- `evidence-api-create-rider.png`
- `evidence-api-create-driver.png`
- `evidence-api-create-trip.png`
- `evidence-api-accept-trip.png`
- `evidence-api-complete-trip.png`
- `evidence-api-rating-final-step.png`
- `evidence-metrics-ride.png`
- `evidence-metrics-payment.png`
- `evidence-metrics-rating.png`
- `evidence-logs-notification-json.png` (structured JSON log readability proof)

## Notes

- Keep terminal text readable (minimum 125% zoom if needed).
- Include timestamp in terminal for evidence screenshots when possible.
- Use PNG format for clarity.
- Prefer readable command screenshots: terminal-equivalent captures should use large font (>=20px).

## Re-record Workflow Video (Playwright)

- Final video output: `docs/screenshots/videos/workflow-demo-playwright.webm`
- Install recorder dependencies (first time only):
  - `cd docs/video-automation`
  - `npm install`
  - `npx playwright install chromium`
- Re-record the guided workflow video:
  - `cd docs/video-automation`
  - `node record-workflow-guided.js`
- Optional faster variant:
  - `cd docs/video-automation`
  - `node record-workflow.js`
