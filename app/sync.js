const db = require('./db');
const express = require('express');
const rp = require('request-promise');
const authenticationMiddleware = require('./auth').authenticateRequestMiddleware;
const user = require('./user');

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

const chunkArray = (arr, chunkSize) => {
  newArray = [];
  for (i = 0; i < arr.length; i += chunkSize) {
    newArray.push(arr.slice(i, i + chunkSize));
  }

  return newArray;
};

const getAllPlayersWithDetail = async () => {
  let detailedPlayers = [];
  const currentPlayers = await getAllPlayers();

  for (let players of chunkArray(currentPlayers, 10)) {
    let parray = [];
    players.forEach((player) => {
      parray.push(getPlayerDetail(player));
    });
    const tmpDetailedPlayers = await Promise.all(parray);
    
    tmpDetailedPlayers.forEach((dp) => {
      detailedPlayers.push([
        dp.id,
        `${dp.first_name} ${dp.last_name}`,
        dp
      ]);
    });
  }
  return detailedPlayers;
};

const syncPlayersWithSC = async (sc_token, includeStats) => {
  const players = await getAllPlayersWithDetail();

  const result = await db.run_query_txn(async (client) => {
    await client.query('delete from player', []);
    const insertStatement = `insert into player(sc_id, name, attributes) values($1, $2, $3)`;
    for (let player of players) {
      await db.run_query(insertStatement, player)
    }
  });
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
      return await syncPlayersWithSC(undefined, false);
    }
    catch(err) {
      return next(err);
    }
});

module.exports.router = router;
