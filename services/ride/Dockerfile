
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY shared ./shared
COPY ride/package*.json ./ride/
WORKDIR /app/ride
RUN npm install
COPY ride ./
CMD ["node","app.js"]
