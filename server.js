//const port = 8080;
const distPath = '.';

// express server
const { join } = require('path');
const express = require('express');
const app = express();
const server = app
  .use(express.static(distPath, ))
  // .use('/src', express.static(join(__dirname, 'src')))
  .get(/^[^.]*$/, (req, rep) =>
    rep.sendFile(join(__dirname, distPath, '/index.html')),
  )
  .listen();
console.log(address(server.address()));
function address(address){
  if(address.family === 'IPv6') address.address = `[${address.address}]`;
  return `http://${address.address}:${address.port}`
}
