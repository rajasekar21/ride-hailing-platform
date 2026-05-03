# Scripts

Primary project path:

- `run-all.sh` - mandatory Minikube end-to-end run. It checks required tools, starts Minikube, builds images, applies Kubernetes manifests, starts port-forwards/frontend, and runs validation.

Minikube substeps used by `run-all.sh`:

- `setup.sh` - install service/frontend dependencies and prepare frontend env.
- `deploy.sh` - start Minikube and print status.
- `build.sh` - build service images into the Minikube Docker environment.
- `apply.sh` - apply Kubernetes manifests.
- `seed.sh` - seed service data when seed scripts exist.
- `port-forward.sh` - expose service ports locally.
- `frontend.sh` - start the frontend dev server.
- `validate.sh` - validate the full Minikube rider -> trip -> driver -> payment -> notification -> rating workflow.
- `cleanup.sh` - remove Kubernetes resources.

Secondary Docker Compose evidence tools:

- `compose-validate.sh` - validate the full workflow against a Docker Compose stack.
- `capture-compose-evidence.sh` - write timestamped Compose evidence under `docs/evidence/generated/`.

Recording helper:

- `minikube-recording-commands.sh` - print commands to capture individual Minikube service clips.
