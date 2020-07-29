FROM node:12

ARG FONTAWESOME_AUTH_TOKEN
WORKDIR /opt/ezshare/
COPY package.json .
RUN npm config set "@fortawesome:registry" https://npm.fontawesome.com/ \
    && npm config set "//npm.fontawesome.com/:_authToken" ${FONTAWESOME_AUTH_TOKEN} \
    && npm install \
    && npm install -g serve
COPY . .
RUN npm run build

EXPOSE 5000

CMD ["serve", "-s", "build/"]
