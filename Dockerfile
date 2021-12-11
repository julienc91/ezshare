FROM node:16

WORKDIR /opt/ezshare/
COPY package.json .
RUN yarn
COPY . .
RUN yarn build

EXPOSE 3000

CMD ["./node_modules/.bin/serve", "-s", "build/"]
