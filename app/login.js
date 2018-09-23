const express = require('express');
const rp = require('request-promise');
const debug = require('debug')('st');
const jwt = require('jsonwebtoken');
const user = require('./user');
const { requireHeaders, cors, jwtSecret } = require('./auth');
const ds = require('./datasource');

const router = express.Router();

router.options('/', 
  cors('GET, OPTIONS', 'Authorization', 'http://localhost:3001'), 
  (req, res) => {
    return res.status(200).send();
});


router.get('/', 
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
    let userId;
    if(existingUser && existingUser.active) {
      debug(`user ${username} exists`);
      const userUpdate = {
        sc_id: accountDetails.id
      };
      await user.updateUser(existingUser.id, userUpdate);
      userId = existingUser.id;
    } else if (existingUser && !existingUser.active) {
      const userUpdate = {
        sc_id: accountDetails.id,
        active: true
      };
      await user.updateUser(existingUser.id, userUpdate);
      const team = await ds.getTeamForUser(existingUser);
      debug(team);
    } else {
      debug(`Creating new user ${username}.`);
      let newUser = {
        username,
        sc_id: accountDetails.id
      };
      userId = await user.createUser(newUser);
      const team = await ds.getTeamForUser(newUser);
      debug(team);
    }

    const userPayload = {
      userId: userId,
      firstName: accountDetails.first_name,
      lastName: accountDetails.last_name,
      username,
      accessToken
    };

    const jwtOptions = {
      expiresIn: tokenResponse.expires_in
    };

    const token = jwt.sign(userPayload, jwtSecret, jwtOptions);

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
