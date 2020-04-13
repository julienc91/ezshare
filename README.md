# ezshare

Share files from your browser using WebRTC.

## Preview

![Upload](https://raw.githubusercontent.com/julienc91/ezshare/master/doc/upload_step1.png)

## Quick Start

### With Docker

Using Docker:

```
$ docker-compose up -d --build
```

This will start two services, the web application on port 5000, and the PeerJS server on port 9000.


### Without Docker

Install dependencies:

```
$ npm install
$ npm install -g serve
```

Create a production build:

```
$ npm run build
```

Start the web application on port 5000:

```
$ serve -s build/
```

Start the PeerJS server on port 9000:

```
./node_modules/.bin/peerjs --port 9000
```
