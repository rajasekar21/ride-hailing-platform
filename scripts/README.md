# Scripts

Primary project path:

- `run-all.sh` - mandatory Minikube end-to-end run. It checks required tools, starts Minikube, builds images, applies Kubernetes manifests, starts port-forwards/frontend, and runs validation.

Minikube substeps used by `run-all.sh`:

- `setup.sh` - install frontend dependencies only when needed and prepare frontend env.
- `deploy.sh` - start Minikube and print status.
- `build.sh` - build service images into the Minikube Docker environment.
- `apply.sh` - apply Kubernetes manifests.
- `seed.sh` - disabled host-side seed notice; service images/repos own runtime seeding.
- `port-forward.sh` - expose service ports locally.
- `frontend.sh` - start the frontend dev server.
- `expose-codespace-ports.sh` - when running in GitHub Codespaces, set forwarded port visibility to public.
- `validate.sh` - validate the full Minikube rider -> trip -> driver -> payment -> notification -> rating workflow.
- `cleanup.sh` - remove Kubernetes resources.

Secondary Docker Compose evidence tools:

- `compose-validate.sh` - validate the full workflow against a Docker Compose stack.
- `capture-compose-evidence.sh` - write timestamped Compose evidence under `docs/evidence/generated/`.

Recording helper:

- `minikube-recording-commands.sh` - print commands to capture individual Minikube service clips.
