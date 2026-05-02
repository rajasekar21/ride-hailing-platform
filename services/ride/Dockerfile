
FROM node:22-bookworm-slim
ENV npm_config_build_from_source=true
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY shared/package*.json ./shared/
COPY shared ./shared
WORKDIR /app/shared
RUN npm install
WORKDIR /app
COPY ride/package*.json ./ride/
WORKDIR /app/ride
RUN npm install
COPY ride ./
CMD ["node","app.js"]
