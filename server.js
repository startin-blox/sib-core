const distPath = '.';

// express server
const { join } = require('path');
const express = require('express');
const port = require('find-free-port')(3000);
const app = express();
(async ()=>{
  const server = app
    .use(express.static(distPath))
    // .use('/src', express.static(join(__dirname, 'src')))
    .get(/^[^.]*$/, (req, rep) =>
      rep.sendFile(join(__dirname, distPath, '/index.html')),
    )
    .listen((await port)[0]);
  console.log(address(server.address()));
  function address(address) {
    if (address.family === 'IPv6') address.address = `[${address.address}]`;
    return `http://${address.address}:${address.port}`;
  }
})();