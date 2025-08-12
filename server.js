// @ts-check

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import cors from 'cors';
import cypress from 'cypress';
import express from 'express';
import findFreePort from 'find-free-port';
const port = findFreePort(3000);
const app = express();
const distPath = '.';
app.use(cors());
// Set the browser language to English to ensure consistent test conditions.
process.env.ELECTRON_EXTRA_LAUNCH_ARGS = '--lang=en';
(async () => {
  const updateURLs = /.*jsonld/;
  const server = app
    .use(express.static(distPath))
    .use(express.json({ type: 'application/*+json' }))
    .get('/favicon.ico', (_req, rep) => void rep.send())
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
    .get(/^\/upload\/.+/, (_req, rep) => {
      rep.sendFile(path.resolve('./fake-image.svg'));
    })
    .get('/mock/users.jsonld', async (req, res) => {
      const limit = Number(req.query.limit);
      const offset = Number(req.query.offset);
      const val = String(req.query['search-terms'] || '');

      const jsonData = await fs.readFile(
        './examples/data/list/users/users-mocked.jsonld',
        { encoding: 'utf8' },
      );
      const data = JSON.parse(jsonData);
      const list = data['ldp:contains'].filter(user =>
        user.first_name.toLowerCase().includes(val.toLowerCase()),
      );
      data['ldp:contains'] = limit ? list.slice(offset, offset + limit) : list;

      res.send(data);
      res.end();
    })
    .get('/examples/', (_req, rep) => rep.redirect('/'))
    // Listen for write requests
    .patch(updateURLs, handleUpdate)
    .post(updateURLs, handleUpdate)
    .put(updateURLs, handleUpdate)
    .delete(updateURLs, handleUpdate)
    .listen((await port)[0], '0.0.0.0');
  server.on('listening', async () => {
    const addr = address(server.address());
    if (
      !process.argv.includes('--test') &&
      !process.argv.includes('--test-ui')
    ) {
      console.log(addr);
      return;
    }
    /** @type {Partial<CypressCommandLine.CypressOpenOptions>}) */
    const opt = {
      testingType: 'e2e',
      browser: 'electron',
      config: {
        e2e: { baseUrl: addr },
      },
    };
    /** @type {void | undefined | CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult} */
    let test;
    try {
      test = process.argv.includes('--test-ui')
        ? await cypress.open(opt)
        : await cypress.run(opt);
    } catch (error) {
      console.error(error);
    } finally {
      server.close();
      if (test && 'totalFailed' in test && test.totalFailed > 0) {
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
  if (req.headers['content-type'] !== 'application/ld+json') {
    rep.status(500).send('Content not JSON');
    return;
  }
  rep.setHeader('location', req.body['@id'] || '');
  rep.send(req.body);
}
