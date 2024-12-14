FROM node:22

ARG TESTING_E2E
ENV VITE_TESTING_E2E=${TESTING_E2E}

WORKDIR /opt/ezshare/
COPY package.json .
RUN yarn
COPY . .
RUN yarn build

EXPOSE 3000

CMD ["yarn", "serve", "-s", "dist/"]
