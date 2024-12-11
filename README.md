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
