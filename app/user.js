const db  = require('./db');

const getUser = async (username) => {
  return await db.run_query('select * from local_user where username = $1', [username]);
};

const createUser = async (user) => {
  return await db.run_query('insert into local_user(username, sc_id) values($1, $2) returning id', [user.username, user.sc_id]);
};

const createRole = async (role) => {
  return await db.run_query('insert into local_user_role(role_name) values($1) returning id', [role]);
};

const assignUserToRole = async (user_id, role_id) => {
  return await db.run_query('insert into local_user_role_rel(user_id, role_id) values($1, $2) returning id', [user_id, role_id]);
};

module.exports.getUser = getUser;
module.exports.createUser = createUser;
module.exports.createRole = createRole;
module.exports.assignUserToRole = assignUserToRole;
