FROM node:15

WORKDIR /opt/ezshare/
COPY package.json .
RUN npm install \
    && npm install -g serve
COPY . .
RUN npm run build

EXPOSE 5000

CMD ["serve", "-s", "build/"]
