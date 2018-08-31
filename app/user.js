const db  = require('./db');

const getUser = async (username) => {
  return await db.run_query('select * from local_user where username = $1', [username]);
};

const addUser = async (user) => {
  return await db.run_query('insert into local_user(username, sc_id) values($1, $2) returning id', [user.username, user.sc_id]);
};

module.exports.getUser = getUser;
module.exports.addUser = addUser;
