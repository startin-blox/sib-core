const crypto = require('crypto');
const distPath = '.';

const { resolve } = require('path');
var url = require('url');
const express = require('express');
const port = require('find-free-port')(3000);
const app = express();
(async () => {
  const server = app
    .use(express.static(distPath))
    .get('/favicon.ico', (req, rep) => rep.send())
    .post('/upload', (req, rep) => {
      const originalUrl = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl,
      });
      rep.setHeader('location', `${originalUrl}/${uniqID()}.jpg`);
      setTimeout(() => rep.send(), 3000);
    })
    .get(/^\/upload\/.+/, (req, rep) => {
      rep.sendFile(resolve('./fake-image.svg'));
    })
    .listen((await port)[0], '0.0.0.0');
  server.on('listening', () => {
    console.log(address(server.address()));
  });
})();

function address(address) {
  if (address.family === 'IPv6') address.address = `[${address.address}]`;
  return `http://${address.address}:${address.port}`;
}

function uniqID() {
  return crypto.randomBytes(5).toString('hex');
}
