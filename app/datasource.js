const rp = require('request-promise');

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

const getTeamForUser = async (user) => {
  let getTeamsReq = {
    method: 'GET',
    uri: `https://supercoach.heraldsun.com.au/api/afl/classic/v1/users/${user.sc_id}/userteams`,
    json: true
  };

  const teams = await rp(getTeamsReq);
  if (teams.length > 0) {
    const team = teams[0];
    return {
      sc_id: team.id,
      name: team.teamname,
      attributes: team
    };
  }
  else {
    return {};
  }
};

module.exports.getAllPlayersWithDetail = getAllPlayersWithDetail;
module.exports.getPlayerDetail = getPlayerDetail;
module.exports.getAllPlayers = getAllPlayers;
