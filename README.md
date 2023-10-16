# ezshare

Share files from your browser using WebRTC.

Demo on: https://ezshare.julienc.io/

## Preview

![Upload](https://raw.githubusercontent.com/julienc91/ezshare/master/doc/upload_step1.png)

## Quick Start

### With Docker

Using Docker:

```
$ docker-compose up -d --build
```

This will start two services, the web application on port 3000, and the PeerJS server on port 9000.

### Without Docker

Install dependencies:

```
$ yarn
```

Create a production build:

```
$ yarn build
```

Start the web application on port 3000:

```
$ yarn serve -s dist/
```

Start the PeerJS server on port 9000:

```
$ yarn peerjs --port 9000
```

## SSL Configuration

I would recommand using Nginx as a reverse proxy for the web application and configure SSL at this level.
For the PeerJS server though, I would suggest modifyng the docker-compose.yml file by replacing the PeerJS command with this one:

```
peerjs:
    ...
    command: yarn peerjs --port 5000 --sslkey /path/to/privkey.pem --sslcert /path/to/fullchain.pem
```

An additional volume may be added to make the cert files available on the container. For example with Let's Encrypt:

```
peerjs:
    ...
    volumes:
    - /etc/letsencrypt/:/etc/letsencrypt/
```
