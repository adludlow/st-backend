const db = require('./db');
const express = require('express');
const rp = require('request-promise');
const authenticationMiddleware = require('./auth').authenticateRequestMiddleware;
const cors = require('./auth').cors;

const router = express.Router();

const syncPlayersWithSC = async (sc_token, includeStats) => {
  const getPlayersReq = {
    method: 'GET',
    uri: 'https://supercoach.heraldsun.com.au/api/afl/classic/v1/players-cf',
    json: true
  };
  
  const playersResponse = await rp(getPlayersReq);

  let getPlayerInfoReq = {
    method: 'GET',
    uri: 'https://supercoach.heraldsun.com.au/api/afl/classic/v1/players/',
    json: true
  };

  playersResponse.forEach( async (player) => {
    getPlayerInfoReq.uri = getPlayerInfoReq.uri + player.id + '?embed=player_stats,positions';
    const playerInfoResponse = await rp(getPlayerInfoReq);
    const insertStatement = `insert into player(sc_id, name, attributes) values($1, $2, $3)`;
    db.run_query(insertStatement, [player.id, `${player.first_name} ${player.last_name}`, playerInfoResponse]);
  });
};

router.get('/sync',
  authenticationMiddleware(),
  async (req, res, next) => {
    await syncPlayersWithSC(undefined, false);

    return res.status(200).send();
});

module.exports.router = router;
