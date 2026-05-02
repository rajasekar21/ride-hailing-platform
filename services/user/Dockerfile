
FROM node:22-bookworm-slim
ENV npm_config_build_from_source=true \
    npm_config_loglevel=error \
    npm_config_fund=false \
    npm_config_audit=false
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY shared/package*.json ./
RUN npm install
COPY shared ./shared
RUN node -e "require.resolve('prom-client', { paths: ['/app/shared'] })"
COPY user/package*.json ./user/
WORKDIR /app/user
RUN npm install
COPY user ./
CMD ["node","app.js"]
