FROM node:18-alpine

WORKDIR /app

COPY auth/package*.json ./
RUN npm install

COPY auth/ ./auth
COPY shared/ ./shared

WORKDIR /app/auth

CMD ["node","app.js"]