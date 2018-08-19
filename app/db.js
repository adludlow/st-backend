const pool = require('pg-pool');
const url = require('url');

const util = require('./util');

// Determine if all required env vars are set.
var missingEnvVars = util.checkEnvVars([
  'DB_URL',
  'DB_CONNECT_USER',
  'DB_CONNECT_PASS'
]);

if(missingEnvVars.length > 0) {
    throw({missingVars: missingEnvVars});
}

const DB_URL = util.getEnvVar("DB_URL");
const DB_URL_COMPONENTS = url.parse(DB_URL);
const DB_CONNECT_USER = util.getEnvVar("DB_CONNECT_USER");
const DB_CONNECT_PASS = util.getEnvVar("DB_CONNECT_PASS");
const DB_MAX_POOL_SIZE = util.getEnvVar("DB_POOL_MAX_SIZE", 10);
const DB_MIN_POOL_SIZE = util.getEnvVar("DB_POOL_MIN_SIZE", 1);
const DB_SSL = util.getEnvVar("DB_SSL", false);

const MAX_RESULT_LIMIT = util.getEnvVar("MAX_RESULT_LIMIT", 100);
const DEFAULT_RESULT_LIMIT = util.getEnvVar("DEFAULT_RESULT_LIMIT", 10);

const config = {
    user: DB_CONNECT_USER,
    password: DB_CONNECT_PASS,
    host: DB_URL_COMPONENTS.hostname,
    port: DB_URL_COMPONENTS.port,
    database: DB_URL_COMPONENTS.pathname.split('/')[1],
    ssl: DB_SSL,
    max: DB_MAX_POOL_SIZE,
    min: DB_MIN_POOL_SIZE
};
const conn_pool = new pool(config);

var run_query = async (query, query_params) => {
    const client = await conn_pool.connect();

    try {
      const result = await client.query(query, query_params);
      return result.rows;
    } catch (e) {
       throw e;
    } finally {
        client.release();
    }
};

var run_query_with_pagination = async (query, query_params, p=undefined, l=undefined) => {
    // page is the current page we are requesting.
    var page = parseInt(p, 10);
    if(isNaN(page) || page < 1) {
        page = 1;
    }
    // limit is the number of results to return per page.
    // default and max are defined by DEFAULT_RESULT_LIMIT and MAX_RESULT_LIMIT env vars.
    var limit = parseInt(l, 10);
    if(isNaN(limit)) {
        limit = DEFAULT_RESULT_LIMIT;
    }
    else if(limit > MAX_RESULT_LIMIT) {
        limit = MAX_RESULT_LIMIT;
    }
    else if(limit < 1) {
        limit = DEFAULT_RESULT_LIMIT;
    }
    var paramIndex = query_params.length+1;
    // Add pagination params
    var paginated_query = query + ` limit $${paramIndex++} offset $${paramIndex++}`;
    // Calculate offset (its 0 indexed).
    var offset = (page - 1) * limit;
    paramValues = query_params.concat([limit, offset]);

    try {
        return await run_query(paginated_query, paramValues);
    }
    catch(e) {
        throw e;
    }
};

var run_query_txn = async (queryBlock) => {
    const client = await conn_pool.connect();
    let results;
    try {
        await client.query('BEGIN');
        results = await queryBlock(client);
        await client.query('COMMIT');
    } catch(e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    return results;
};

module.exports.pool = conn_pool;
module.exports.run_query = run_query;
module.exports.run_query_with_pagination = run_query_with_pagination;
module.exports.run_query_txn = run_query_txn;
