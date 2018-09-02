const db  = require('./db');
const debug = require('debug')('st');
const express = require('express');

// User functions

const getRolesForUser = async (id) => {
  return await db.run_query(
    `select r.*
    from local_user u,
    local_user_role r,
    local_user_role_rel ur
    where u.id = $1
    and ur.user_id = u.id
    and r.id = ur.role_id`,
    [id]
  );
};

const getUsers = async () => {
  return db.run_query(`select u.* from local_user u`, []);
};

const getUserByUsername = async (username) => {
  let user = await db.run_query(
    `select u.* 
    from local_user u
    where u.username = $1`,
    [username]
  );
  if (user.length === 0) {
    return undefined;
  }
  user = user[0];
  const roles = await getRolesForUser(user.id);
  user.roles = roles;
  debug(user);
  return user;
};

const getUser = async (id) => {
  let user = await db.run_query(
    `select u.* 
    from local_user u
    where u.id= $1`,
    [id]
  );
  if (user.length === 0) {
    return undefined;
  }
  user = user[0];

  const roles = await getRolesForUser(user.id);
  user.roles = roles;
  debug(user);
  return user;
  return await db.run_query('select * from local_user where id = $1', [id]);
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
module.exports.getUserByUsername = getUserByUsername;
module.exports.createUser = createUser;
module.exports.createRole = createRole;
module.exports.assignUserToRole = assignUserToRole;

// Role functions

const getRoleByRolename = async (rolename) => {
  let role = await db.run_query('select * from local_user_role where role_name = $1', [rolename]); 
  if (role.length === 0) {
    return undefined;
  }
  return role[0];
};

const addRole = async (rolename) => {
  const id = await db.run_query('insert into local_user_role(role_name) values($1) returning id', [rolename]);
  return id;
};

const router = express.Router();

router.get('/', async (req, res, next) => {
  const users = await getUsers();

  return res.status(200).send(users);
});

router.get('/:id', async (req, res, next) => {
  const user = await getUser(req.params.id);
  if (user === undefined) {
    return res.status(404).send();
  }
  return res.status(200).send(user);
});

router.post('/:userId/role/:rolename', async (req, res, next) => {
  let user = await getUser(req.params.userId);
  if (user === undefined) {
    return res.status(404).send({ result: `User with id ${req.params.userId} does not exist.` });
  }
  const role = await getRoleByRolename(req.params.rolename);
  if (role === undefined) {
    return res.status(404).send({ result: `role ${req.params.rolename} does not exist` });
  }
  const id = await assignUserToRole(req.params.userId, role.id);
  user.roles.push(role);
  return res.status(200).send(user);
});

module.exports.router = router;
