const db = require('./db');
const express = require('express');
const authenticationMiddleware = require('./auth').authenticateRequestMiddleware;

const router = express.Router();

const LEAGUE_EXISTS = -1;

const addLeague = async (leagueid) => {
  try {
    return await db.run_query('insert into league (sc_id) values($1) returning id', leagueid);
  }
  catch (err) {
    if(e.code === '23505') {
      return LEAGUE_EXISTS;
    }
    return err;
  }
};

router.post('/:leagueid',
  authenticationMiddleware(),
  async (req, res, next) => {
    const id = await addLeague(req.params.leagueid);
    if(id === LEAGUE_EXISTS) {
      return res.send(409).send(
        {
          error: 'League already added.'
        }
      );
    } 
  });

module.exports.router = router;
