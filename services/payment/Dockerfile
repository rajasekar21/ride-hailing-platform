FROM node:18-alpine

WORKDIR /app

COPY payment/package*.json ./
RUN npm install

COPY payment/ ./payment
COPY shared/ ./shared

WORKDIR /app/payment

CMD ["node","app.js"]
