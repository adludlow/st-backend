const db = require('./db');
const express = require('express');
const authenticationMiddleware = require('./auth').authenticateRequestMiddleware;
const user = require('./user');

const router = express.Router();

const startSeason = async () => {
  const year = (new Date()).getFullYear();
  return await db.run_query('insert into season (year) values($1) returning id', [year]);
};

router.post('/startseason',
  authenticationMiddleware(),
  user.getRequestingUserMiddleware,
  user.userIsAdminMiddleware,
  async (req, res, next) => {
    const id = await startSeason();

    return res.status(200).send({ result: { seasonid: id }});
  });

module.exports.router = router;
