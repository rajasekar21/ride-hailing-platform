FROM node:18-alpine

WORKDIR /app

COPY ride/package*.json ./
RUN npm install

COPY ride/ ./ride
COPY shared/ ./shared

WORKDIR /app/ride

CMD ["node","app.js"]