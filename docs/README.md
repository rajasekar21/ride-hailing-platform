# Documentation Pack

This folder contains submission-ready documentation artifacts and screenshot evidence for the assignment.

## Structure

- `api/API_DOCUMENTATION.md` - API reference and Postman/OpenAPI notes
- `architecture/ER_DATA_MODEL.md` - data model and ER diagram notes
- `SUBMISSION_RECORDING_GUIDE.md` - 10-15 minute recording flow aligned to the assignment
- `evidence/DEPLOYMENT_EVIDENCE.md` - Docker/Kubernetes/API proof checklist
- `evidence/PAYMENT_SOURCE_VERIFICATION.md` - source excerpt proof for idempotency and rate limiting
- `evidence/generated/` - timestamped command-output proof from the current Docker Compose run
- `screenshots/README.md` - screenshot naming convention and capture checklist

## Quick Start

1. Follow `docs/SUBMISSION_RECORDING_GUIDE.md` for the recommended recording order.
2. Capture all required screenshots and save them under `docs/screenshots/`.
3. Run `./scripts/capture-compose-evidence.sh` after the Docker Compose validation passes.
4. Fill in command outputs and observations in `docs/evidence/DEPLOYMENT_EVIDENCE.md`.
5. Add your API collection/spec links to `docs/api/API_DOCUMENTATION.md`.
6. Add ER diagram image and model notes in `docs/architecture/ER_DATA_MODEL.md`.

