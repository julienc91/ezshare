FROM node:24 AS builder

WORKDIR /app
COPY package.json package-lock.json ./

ARG TESTING_E2E
ENV VITE_TESTING_E2E=${TESTING_E2E}

RUN npm ci
COPY . .

RUN npm run build

FROM node:24-slim AS runtime

RUN useradd --user-group --create-home --shell /bin/false appuser \
    && mkdir -p /app/dist \
    && chown -R appuser:appuser /app

WORKDIR /app

COPY --from=builder /app/dist ./dist
USER appuser
EXPOSE 3000

CMD ["npx", "serve", "-s", "dist/"]
