
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY shared ./shared
COPY payment/package*.json ./payment/
WORKDIR /app/payment
RUN npm install
COPY payment ./
CMD ["node","app.js"]
