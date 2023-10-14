FROM node:20

WORKDIR /opt/ezshare/
COPY package.json .
RUN yarn
COPY . .
RUN yarn build

EXPOSE 3000

CMD ["yarn", "serve", "-s", "dist/"]
