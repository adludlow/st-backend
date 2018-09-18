const db  = require('./db');
const debug = require('debug')('st');
const express = require('express');
const authenticationMiddleware = require('./auth').authenticateRequestMiddleware;
const cors = require('./auth').cors;

const USER_ROLE_REL_EXISTS = -1;
const UNKNOWN_ERROR = -100;

const APP_ADMIN_ROLE = 'app_admin';

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

const getRequestingUserMiddleware = async (req, res, next) => {
  const fullUser = await getUser(req.authenticatedUser.userId);
  req.requestingUserFull = fullUser;
  next();
};

const createUser = async (user) => {
  return await db.run_query('insert into local_user(username, sc_id) values($1, $2) returning id', [user.username, user.sc_id]);
};

const updateUser = async (id, user) => {
  let sql = 'update local_user';
  let paramIndex = 2;
  let params = [id];
  Object.keys(user).forEach((key) => {
    sql = sql + ` set ${key} = $${paramIndex}`;
    params.push(user[key]);
  });
  sql = sql + ` where id = $1`;

  return await db.run_query(sql, params);
};

const createRole = async (role) => {
  return await db.run_query('insert into local_user_role(role_name) values($1) returning id', [role]);
};

const assignUserToRole = async (user_id, role_id) => {
  try {
    return await db.run_query('insert into local_user_role_rel(user_id, role_id) values($1, $2) returning id', [user_id, role_id]);
  }
  catch(e) {
    if(e.code === '23505') {
      console.log(`user with id ${user_id} is already assigned to role with id ${role_id}`);
      return USER_ROLE_REL_EXISTS;
    }
    return UNKNOWN_ERROR;;
  }
};

module.exports.getUser = getUser;
module.exports.getUserByUsername = getUserByUsername;
module.exports.createUser = createUser;
module.exports.updateUser = updateUser;
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

router.get('/',
  authenticationMiddleware(),
  async (req, res, next) => {
  const users = await getUsers();

  return res.status(200).send(users);
});
   
router.get('/:id', 
  cors('GET, OPTIONS', 'Authorization', 'http://localhost:3001'), 
  authenticationMiddleware(),
  async (req, res, next) => {
  const user = await getUser(req.params.id);
  if (user === undefined) {
    return res.status(404).send();
  }
  return res.status(200).send(user);
});

router.put('/:id',
  cors('GET, OPTIONS', 'Authorization', 'http://localhost:3001'), 
  authenticationMiddleware(),
  async (req, res, next) => {

}); 

const userIsAdmin = (user) => {
  if (user.roles.some( r => r.role_name === APP_ADMIN_ROLE )) {
    return true;
  }
  return false;
};

const userIsAdminMiddleware = (req, res, next) => {
  const requestingUser = req.requestingUserFull;
  if (userIsAdmin(requestingUser)) {
    return next();
  } else {
    return res.status(403).send("User is not authorised for this operation.");
  }
};

// Checks if the requesting user in req.requestingUserFull is assigned to the
// same role as the role in the rolename path param.
const requestingUserHasRole = (passForAdmin = false) => (req, res, next) => {
  const role = req.params.rolename;
  const requestingUser = req.requestingUserFull;

  if (requestingUser.roles.some( (r) => {
    if (passForAdmin && r.role_name === APP_ADMIN_ROLE) {
      return true;
    }
    return r.role_name === role
  })){
    return next();
  }
  else {
    return res.status(403).send("User is not authorised for this operation.");
  }
};

router.post('/:userId/role/:rolename', 
  cors('GET, OPTIONS', 'Authorization', 'http://localhost:3001'), 
  authenticationMiddleware(),
  getRequestingUserMiddleware,
  requestingUserHasRole(true),
  async (req, res, next) => {
    try {
      let user = await getUser(req.params.userId);
      if (user === undefined) {
        return res.status(404).send({ result: `User with id ${req.params.userId} does not exist.` });
      }
      const role = await getRoleByRolename(req.params.rolename);
      if (role === undefined) {
        return res.status(404).send({ result: `role ${req.params.rolename} does not exist` });
      }
      const id = await assignUserToRole(req.params.userId, role.id);
      if(id === -1) {
        return res.status(409).send();
      }
      if(id < -1) {
        return res.status(500).send();
      }
      user.roles.push(role);
      return res.status(200).send(user);
    }
    catch(e) {
      return next(e);
    }
});

module.exports.router = router;
module.exports.userIsAdminMiddleware = userIsAdminMiddleware;
module.exports.getRequestingUserMiddleware = getRequestingUserMiddleware;
