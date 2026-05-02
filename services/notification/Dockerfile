
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install
WORKDIR /app
COPY shared ./shared
COPY notification/package*.json ./notification/
WORKDIR /app/notification
RUN npm install
COPY notification ./
CMD ["node","app.js"]
