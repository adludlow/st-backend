const express = require('express');
const rp = require('request-promise');
const db = require('./db');

const app = express();

app.get('/health', (req, res) => {
  req.send('OK');
});

app.post('/login', async (req, res) => {
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

    let existingUser = await db.run_query('select * from local_user where username = $1', [username]);
    if(existingUser.length > 0) {
      console.log('user exists');
    }
    else {
      console.log('Creating new user.');
      const accountDetailsReq = {
        method: 'GET',
        uri: 'https://supercoach.heraldsun.com.au/api/afl/classic/v1/me',
        auth: {
          bearer: accessToken
        },
        json: true
      };

      let accountDetails = await rp(accountDetailsReq);
      db.run_query('insert into local_user(username, sc_id) values($1, $2)', [username, accountDetails.id]);
    }
    
    res.status(200).send({
      username,
      accessToken
    });
  }
  catch (e) {
    throw e;
  }
});

// Error handler.
app.use((err, req, res, next) => {
  console.log(`**** ERROR: ${err}`);
  console.log(err.stack);
  var error = {
      "errorDetail": `${err}`
  }
  var statusCode = 500;

  res.status(statusCode).send(error);
});

app.listen(3000, () => console.log('Server started.'));

module.exports.app = app;
