const { Pool } = require("pg");
const PgApi = require("./Api");

module.exports = config => {
  return new Promise(resolve => {
    const pool = new Pool(config);
    resolve(new PgApi(pool, config));
  });
};
