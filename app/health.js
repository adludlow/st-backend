const express = require('express');
const debug = require('debug')('st');

const router = express.Router();

router.get('/', (req, res) => {
  req.send('OK');
});

module.exports.router = router;
