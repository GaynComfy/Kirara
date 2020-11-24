const { Pool } = require("pg");

class PgApi {
  /**
   *
   * @param {Pool} pool
   * @param {*} config
   */
  constructor(pool, config) {
    this.pool = pool;
    this.config = config;
  }
}
module.exports = PgApi;
