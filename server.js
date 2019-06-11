const distPath = '.';

const express = require('express');
const port = require('find-free-port')(3000);
const app = express();

(async ()=>{
  const server = app
    .use(express.static(distPath))
    .listen((await port)[0]);
  console.log(address(server.address()));
})();

function address(address) {
  if (address.family === 'IPv6') address.address = `[${address.address}]`;
  return `http://${address.address}:${address.port}/`;
}
