
FROM node:18-alpine
WORKDIR /app
COPY ../../dataset ./dataset
COPY . .
RUN npm install
CMD ["node","app.js"]
