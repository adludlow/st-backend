const express = require('express');
const health_router = require('./health').router;
const auth_router = require('./auth').router;
const user_router = require('./user').router;
const login_router = require('./login').router;
const player_router = require('./player').router;
const league_router = require('./league').router;
const sync_router = require('./sync').router;
const admin_router = require('./admin').router;

const app = express();

app.use('/health', health_router);
app.use('/auth', auth_router);
app.use('/users', user_router);
app.use('/login', login_router);
app.use('/sync', sync_router);
app.use('/admin', admin_router);

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
