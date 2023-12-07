const crypto = require("crypto");
const cypress = require("cypress");
var url = require("url");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const findFreePort = require("find-free-port");
const fs = require("fs");
const cors = require('cors');
const port = findFreePort(3000);
const app = express();
const distPath = '.';

app.use(cors({credentials: true, origin: 'http://0.0.0.0:3000'}));
(async () => {
  const updateURLs = /.*jsonld/;
  const server = app
    .use(express.static(distPath))
    .use(bodyParser.json({ type: 'application/*+json' }))
    .get('/favicon.ico', (req, rep) => rep.send())
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
      rep.sendFile(path.resolve('./fake-image.svg'));
    })
    .get('/mock/users.jsonld', async (req, res) => {
      const limit = Number(req.query.limit);
      const offset = Number(req.query.offset);
      const val = req.query["search-terms"] || "";

      const jsonData = fs.readFileSync("./examples/data/list/users-mocked.jsonld", { encoding: "utf8" });
      const data = JSON.parse(jsonData);
      const list = data["ldp:contains"].filter(user => user["first_name"].toLowerCase().includes(val.toLowerCase()));
      data["ldp:contains"] = limit ? list.slice(offset, offset + limit) : list;

      res.send(data);
      res.end();
    })
    .get('/examples/', (req, rep) => rep.redirect('/'))
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
      if (test.totalFailed) {
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

