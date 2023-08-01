const crypto = require('crypto');
const distPath = '.';
const cypress = require('cypress');

const { resolve } = require('path');
var url = require('url');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = require('find-free-port')(3000);
const app = express();
app.use(cors());
(async () => {
  const updateURLs = /.*jsonld/;
  const server = app
    .use(express.static(distPath))
    .use(bodyParser.json({ type: 'application/*+json' }))
    .get('/favicon.ico', (req, rep) => rep.send())
    .get('/examples/', (req, rep) => rep.redirect('/'))
    // Handle upload
    .post('/upload', (req, rep) => {
      const originalUrl = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl,
      });
      rep.setHeader('location', `${originalUrl}/${uniqID()}.jpg`);
      setTimeout(() => rep.send(), 1200);
    })
    .get(/^\/upload\/.+/, (req, rep) => {
      rep.sendFile(resolve('./fake-image.svg'));
    })
    // Listen for write requests
    .patch(updateURLs, handleUpdate)
    .post(updateURLs, handleUpdate)
    .put(updateURLs, handleUpdate)
    .delete(updateURLs, handleUpdate)
    .listen((await port)[0], '0.0.0.0');
  server.on('listening', async () => {
    const addr = address(server.address());
    if (!process.argv.includes('--test') && !process.argv.includes('--test-ui')) {
      console.log(addr);
      return;
    }
    let test;
    try {
      const opt = {
        config: {
          baseUrl: addr,
        },
      }
      test = await (process.argv.includes('--test-ui') ?
        cypress.open(opt) : cypress.run(opt));
    }
    catch (error) {
      console.error(error);
    } finally {
      server.close();
      if(test.totalFailed) {
        process.exit(1);
      }
    }
  });
})();

function address(address) {
  if (address.family === 'IPv6') address.address = `[${address.address}]`;
  return `http://${address.address}:${address.port}`;
}

function uniqID() {
  return crypto.randomBytes(5).toString('hex');
}

function handleUpdate(req, rep) {
  if (req.headers['content-type'] != 'application/ld+json') {
    rep.status(500).send('Content not JSON');
    return;
  }
  rep.setHeader('location', req.body['@id'] || '');
  rep.send(req.body);
}

