FROM node:18-alpine

WORKDIR /app

COPY notification/package*.json ./
RUN npm install

COPY notification/ ./notification   
COPY shared/ ./shared

WORKDIR /app/notification

CMD ["node","app.js"]
