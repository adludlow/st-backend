const db = require('./db');
const express = require('express');
const rp = require('request-promise');
const authenticationMiddleware = require('./auth').authenticateRequestMiddleware;
const cors = require('./auth').cors;

const router = express.Router();

module.exports.router = router;
