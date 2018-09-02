const express = require('express');
const debug = require('debug')('st');
const rp = require('request-promise');
const jwt = require('jsonwebtoken');
const user = require('./user');
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
  if (authenticateRequest) {
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

router.options('/login', 
  cors('GET, OPTIONS', 'Authorization', 'http://localhost:3001'), 
  (req, res) => {
    return res.status(200).send();
});

router.get('/login', 
  cors('GET, OPTIONS', 'Authorization', 'http://localhost:3001'), 
  requireHeaders(['Authorization']), 
  async (req, res, next) => {
  try {
    const creds = Buffer.from(
      req.get('Authorization')
        .substring(6), 'base64')
        .toString('ascii');

    const [username, password] = creds.split(':');

    const accessTokenReq = {
      method: 'POST',
      uri: 'https://supercoach.heraldsun.com.au/api/afl/classic/v1/access_token',
      body: {
        grant_type: "password",
        client_id: "Lf7m0371XCbMBlQ0fAFoGRJlfCs2JZpYvLU1uEvd",
        client_secret:"",
        username: username,
        password: password
      },
      json: true
    };

    let tokenResponse = await rp(accessTokenReq);
    let accessToken = tokenResponse.access_token;

    const accountDetailsReq = {
      method: 'GET',
      uri: 'https://supercoach.heraldsun.com.au/api/afl/classic/v1/me',
      auth: {
        bearer: accessToken
      },
      json: true
    };

    let accountDetails = await rp(accountDetailsReq);

    let existingUser = await user.getUserByUsername(username);
    if(existingUser) {
      debug(`user ${username} exists`);
    }
    else {
      debug(`Creating new user ${username}.`);
      let newUser = {
        username,
        sc_id: accountDetails.id
      };
      const userId = await user.createUser(newUser);
    }

    const userPayload = {
      firstName: accountDetails.first_name,
      lastName: accountDetails.last_name,
      username,
      accessToken
    };

    const jwtOptions = {
      expiresIn: tokenResponse.expires_in
    };

    const token = jwt.sign(userPayload, secret, jwtOptions);

    return res.status(200).send({
      token
    });
  }
  catch (e) {
    if(e.statusCode === 400) {
      res.set({'WWW-Authenticate': 'Basic realm="Authenticated user area"'});
      return res.status(401).send();
    }
    else {
      return next(e);
    }
  }
});

module.exports.router = router;
module.exports.authenticateRequestMiddleware = authenticateRequestMiddleware;
