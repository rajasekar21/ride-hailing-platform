# Scripts

Primary project path:

- `run-minikube.sh` - mandatory Minikube end-to-end run. It checks required tools, starts Minikube, builds images, deploys manifests, starts port-forwards/frontend, exposes Codespace ports, and validates the workflow.

Minikube substeps used by `run-minikube.sh`:

- `setup-frontend.sh` - install frontend dependencies only when needed and prepare frontend env.
- `start-minikube.sh` - start Minikube with the Docker driver and print status.
- `build-minikube-images.sh` - build service images into the Minikube Docker environment.
- `deploy-k8s-manifests.sh` - apply Kubernetes manifests and wait for rollouts.
- `forward-minikube-ports.sh` - expose service ports locally.
- `start-frontend.sh` - start the frontend dev server.
- `expose-codespace-ports.sh` - when running in GitHub Codespaces, set forwarded port visibility to public.
- `validate-minikube-workflow.sh` - validate the full Minikube rider -> trip -> driver -> payment -> notification -> rating workflow.
- `cleanup-minikube.sh` - remove Kubernetes resources and stale port-forwards.

Secondary Docker Compose evidence tools:

- `compose-validate.sh` - validate the full workflow against a Docker Compose stack.
- `capture-compose-evidence.sh` - write timestamped Compose evidence under `docs/evidence/generated/`.

Recording helper:

- `print-minikube-recording-commands.sh` - print commands to capture individual Minikube service clips.
