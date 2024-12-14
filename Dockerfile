FROM node:22 AS builder

WORKDIR /app
COPY package.json yarn.lock ./

ARG TESTING_E2E
ENV VITE_TESTING_E2E=${TESTING_E2E}

RUN yarn install --frozen-lockfile
COPY . .

RUN yarn build

FROM node:22-slim AS runtime

RUN useradd --user-group --create-home --shell /bin/false appuser \
    && mkdir -p /app/dist \
    && chown -R appuser:appuser /app \
    && yarn global add serve@^14.0.1

WORKDIR /app

COPY --from=builder /app/dist ./dist
USER appuser
EXPOSE 3000

CMD ["serve", "-s", "dist/"]
