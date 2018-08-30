const express = require('express');
const health_router = require('./health').router;
const login_router = require('./login').router;

const app = express();

app.use('/health', health_router);
app.use('/login', login_router);

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
