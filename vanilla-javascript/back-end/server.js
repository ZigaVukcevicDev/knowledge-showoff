import util from 'util';
import express from 'express';
import bodyParser from 'body-parser';

// import custom services
import locations from './services/locations';

// it will load the right one based on .env NODE_ENV setting
require('dotenv').config()
let config = require('config');

const hostBPservice = config.service.host;
const hostBPport = config.service.port;

const endpoint = '/services';

const app = express();

// standard logging
process.stdin.pipe(process.stdout);

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// healthcheck endpoint
app.get(`${endpoint}/healthcheck`, (req, res) => {
  res
    .status(200)
    .type('text/plain')
    .send('OK')
    .end();
});

// add your custom endpoints
app.use(`${endpoint}/locations`, locations());

// starting server
app.listen(hostBPport, hostBPservice, () => {
  util.log(`Listening on port http://${hostBPservice}:${hostBPport}`);
});
