const db = require('./db');
const express = require('express');
const authenticationMiddleware = require('./auth').authenticateRequestMiddleware;
const user = require('./user');
const data = require('./datasource');
const debug = require('debug')('supertrader');

const router = express.Router();

const syncPlayersWithDatasource = async (sc_token, includeStats) => {
  debug('Retrieving player data...');
  const players = await data.getAllPlayersWithDetail();
  debug('Player data retrieved.');

  debug('Inserting player data into database...');
  const result = await db.run_query_txn(async (client) => {
    await client.query('delete from player', []);
    const insertStatement = `insert into player(sc_id, name, attributes) values($1, $2, $3)`;
    for (let player of players) {
      await db.run_query(insertStatement, player)
    }
  });
  debug('Player data inserted.');
};

router.get('/players',
  authenticationMiddleware(),
  user.getRequestingUserMiddleware,
  user.userIsAdminMiddleware,
  async (req, res, next) => {
    try {
      res.status(200).send(
        {
          result: 'Sync started.'
        }
      );
      return await syncPlayersWithDatasource(undefined, false);
    }
    catch(err) {
      return next(err);
    }
});

module.exports.router = router;
