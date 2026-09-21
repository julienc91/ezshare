# ezshare

Share files from your browser using WebRTC.

Demo on: https://ezshare.julienc.io/

## Preview

![Upload](https://raw.githubusercontent.com/julienc91/ezshare/master/doc/upload_step1.png)

## Quick Start

### With Docker

Using Docker:

```
$ docker run ghcr.io/julienc91/ezshare
```

This will start two services, the web application on port 3000, and the PeerJS server on port 9000.

### Without Docker

Install dependencies:

```
$ npm ci
```

Create a production build:

```
$ npm run build
```

Start the web application on port 3000:

```
$ npx serve -s dist/
```

## Configuration

### Signaling relays

WebRTC peers find each other through MQTT signaling relays. By default, the public brokers
built into [trystero](https://github.com/dmotz/trystero) are used. To use your own MQTT broker(s)
instead (they must expose a WebSocket listener), set the `RELAY_URLS` build argument to a
comma-separated list of URLs:

```
$ docker build . --build-arg RELAY_URLS='wss://mqtt.example.com:8884/mqtt' -t ezshare
```

Without Docker, set the `VITE_RELAY_URLS` environment variable when building:

```
$ VITE_RELAY_URLS='wss://mqtt.example.com:8884/mqtt' npm run build
```
