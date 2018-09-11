const express = require('express');
const debug = require('debug')('st');
const jwt = require('jsonwebtoken');
const router = express.Router();

const secret = process.env.JWT_SECRET;

const requireHeaders = (requiredHeaders) => {
  return (req, res, next) => {
    if(requiredHeaders.every(val => Object.keys(req.headers).includes(val.toLowerCase()))) {
      return next();
    }
    else {
      return res.status(400).send({ error: `Missing one or more required headers: ${requiredHeaders}` });
    }
  }
};

const cors = (methods, headers, origins) => {
  return (req, res, next) => {
    res.set({
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': headers,
      'Access-Control-Allow-Origin': origins
    });
    return next();
  };
};

const validateToken = (token) => {
  try {
    return decoded = jwt.verify(token, secret);
  }
  catch(err) {
    return false;
  }
};

const authenticateRequest = (req) => {
  const token = req.get('Token');
  if(token === undefined) {
    return false;
  }
  const decodedToken = validateToken(token);
  if (decodedToken) {
    return decodedToken;
  }
  else {
    return false;
  }
};

const authenticateRequestMiddleware = () => (req, res, next) => {
  const user = authenticateRequest(req);
  if (user) {
    req.authenticatedUser = user;
    return next();
  }
  else {
    return res.status(401).send();
  }
};

router.get('/validate-token', (req, res, next) => {
  const validationResult = authenticateRequest(req);
  if(validationResult) {
    return res.status(200).send(validationResult);
  }
  else {
    return res.send.status(401).send();
  }
});

module.exports.router = router;
module.exports.authenticateRequestMiddleware = authenticateRequestMiddleware;
module.exports.cors = cors;
module.exports.requireHeaders = requireHeaders;
module.exports.jwtSecret = secret;
