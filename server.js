const port = 8080;
const distPath = '.';

// express server
const { join } = require('path');
const express = require('express');
const app = express();
app
  .use(express.static(distPath, ))
  // .use('/src', express.static(join(__dirname, 'src')))
  .get(/^[^.]*$/, (req, rep) =>
    rep.sendFile(join(__dirname, distPath, '/index.html')),
  )
  .listen(port);
console.log(`http://localhost:${port}`);
