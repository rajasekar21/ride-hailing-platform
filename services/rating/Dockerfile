FROM node:18-slim

WORKDIR /app

COPY rating/package*.json ./

RUN apt-get update && apt-get install -y python3 build-essential libsqlite3-dev && \
    npm install --build-from-source sqlite3 && \
    npm install && \
    rm -rf /var/lib/apt/lists/*

COPY rating/ ./rating
COPY shared/ ./shared

WORKDIR /app/rating

CMD ["node","app.js"]