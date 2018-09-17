const db = require('./db');
const express = require('express');
const rp = require('request-promise');
const authenticationMiddleware = require('./auth').authenticateRequestMiddleware;

const router = express.Router();

const getAllPlayers = async () => {
  const getPlayersReq = {
    method: 'GET',
    uri: 'https://supercoach.heraldsun.com.au/api/afl/classic/v1/players-cf',
    json: true
  };
  
  return await rp(getPlayersReq);
};

const getPlayerDetail = async (player) => {
  let getPlayerInfoReq = {
    method: 'GET',
    uri: 'https://supercoach.heraldsun.com.au/api/afl/classic/v1/players/',
    json: true
  };

  getPlayerInfoReq.uri = getPlayerInfoReq.uri + player.id + '?embed=player_stats,positions';
  return await rp(getPlayerInfoReq);
};

const getAllPlayersWithDetail = async () => {
  let detailedPlayers = [];
  const currentPlayers = await getAllPlayers();
  for (let player of currentPlayers) {
    let playerDetail = await getPlayerDetail(player);
    detailedPlayers.push([
      player.id,
      `${player.first_name} ${player.last_name}`,
      playerDetail
    ]);
  }
  return detailedPlayers;
};

const syncPlayersWithSC = async (sc_token, includeStats) => {
  console.log('Retrieving players...');
  const players = await getAllPlayersWithDetail();
  console.log('Players retreived.');

  console.log('Inserting players into db...');
  const insertStatement = `insert into player(sc_id, name, attributes) values($1, $2, $3)`;
  for (let player of players) {
    await db.run_query(insertStatement, player)
  }
  console.log('Players inserted.');
};

router.get('/players',
  authenticationMiddleware(),
  async (req, res, next) => {
    res.status(200).send(
      {
        result: 'Sync started.'
      }
    );
    // TODO: Currently sync. SHould store the job somewhere then send a
    // response indicating the job has started.
    return await syncPlayersWithSC(undefined, false);
});

module.exports.router = router;
