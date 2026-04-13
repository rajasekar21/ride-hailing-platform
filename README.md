
Run:
minikube start
eval $(minikube docker-env)
docker build -t user ./services/user
docker build -t ride ./services/ride
kubectl apply -f k8s/
