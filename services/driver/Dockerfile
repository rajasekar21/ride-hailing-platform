FROM node:18-alpine

WORKDIR /app

COPY driver/package*.json ./
RUN npm install

COPY driver/ ./driver
COPY shared/ ./shared

WORKDIR /app/driver

CMD ["node","app.js"]