FROM node:25 AS builder

WORKDIR /app
COPY package.json package-lock.json ./

ARG TESTING_E2E
ENV VITE_TESTING_E2E=${TESTING_E2E}

ARG RELAY_URLS
ENV VITE_RELAY_URLS=${RELAY_URLS}

RUN npm ci
COPY . .

RUN npm run build

FROM ghcr.io/static-web-server/static-web-server:2.44.0 AS runtime

COPY --from=builder /app/dist /public

ENV SERVER_PORT=3000 \
    SERVER_ROOT=/public \
    SERVER_FALLBACK_PAGE=/public/index.html

USER 65534:65534
EXPOSE 3000
