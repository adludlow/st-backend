const express = require('express');
const debug = require('debug')('st');
const rp = require('request-promise');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();

const secret = process.env.JWT_SECRET;

router.options('/', (req, res) => {
  res.set({
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization',
    'Access-Control-Allow-Origin': 'http://localhost:3001'
  });

  res.status(200).send();
});

router.get('/validate-token', (req, res, next) => {
  const token = req.get('Token');
  if(token === undefined) {
    console.log('No Token header');
    res.status(401).send();
    return;
  }
  try {
    const decoded = jwt.verify(token, secret);
    res.status(200).send(decoded);
    return;
  }
  catch(err) {
    res.status(401).send();
    return;
  }
});

router.get('/', async (req, res, next) => {
  res.set({
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization',
    'Access-Control-Allow-Origin': 'http://localhost:3001'
  });
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

    let existingUser = await db.run_query('select * from local_user where username = $1', [username]);
    if(existingUser.length > 0) {
      console.log('user exists');
    }
    else {
      console.log('Creating new user.');
      db.run_query('insert into local_user(username, sc_id) values($1, $2)', [username, accountDetails.id]);
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

    res.status(200).send({
      token
    });
  }
  catch (e) {
    if(e.statusCode === 400) {
      res.set({'WWW-Authenticate': 'Basic realm="Authenticated user area"'});
      res.status(401).send();
    }
    else {
      next(e);
    }
  }
});

module.exports.router = router;
