
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY shared ./shared
COPY user/package*.json ./user/
WORKDIR /app/user
RUN npm install
COPY user ./
CMD ["node","app.js"]
