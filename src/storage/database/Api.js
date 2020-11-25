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
  async simpleQuery(table, object) {
    const values = Object.values(object);
    let query = `SELECT * FROM ${table} WHERE ${Object.keys(object)
      .map((e, index) => `${e}=$${index + 1}`)
      .join(" AND ")}`;
    return this.pool.query(query, values);
  }

  async simpleDelete(table, object) {
    const values = Object.values(object);
    let query = `DELETE FROM ${table} WHERE ${Object.keys(object)
      .map((e, index) => `${e}=$${index + 1}`)
      .join(" AND ")}`;
    return this.pool.query(query, values);
  }

  async simpleInsert(table, object) {
    const query = `INSERT INTO ${table} (${Object.keys(object).join(
      ", "
    )}) VALUES(${Object.keys(object)
      .map((entry, index) => `$${index + 1}`)
      .join(", ")}) RETURNING *`;
    const values = Object.values(object);
    return this.pool.query(query, values);
  }
  async simpleUpdate(table, query, update) {
    const updateValues = Object.values(update);

    const queryStr = `UPDATE ${table} SET ${Object.keys(update)
      .map((key, index) => `${key}=$${index + 1}`)
      .join(", ")} WHERE ${Object.keys(query)
      .map((e, index) => `${e}=$${index + 1 + updateValues.length}`)
      .join(" AND ")}`;
    const values = [...updateValues, ...Object.values(query)];
    return this.pool.query(queryStr, values);
  }

  async createTables() {
    await this.pool.query(
      "CREATE TABLE IF NOT EXISTS SERVERS (id BIGSERIAL PRIMARY KEY, guild_id VARCHAR, owner_id VARCHAR, description VARCHAR, banner VARCHAR, icon VARCHAR, active BOOLEAN DEFAULT false, large BOOLEAN DEFAULT false, log_channel VARCHAR, event BOOLEAN DEFAULT false, timer BOOLEAN DEFAULT false)"
    );
    await this.pool.query(
      "CREATE TABLE IF NOT EXISTS CARD_ROLES (id BIGSERIAL PRIMARY KEY, server_id BIGINT, tier VARCHAR, role_id VARCHAR)"
    );
    await this.pool.query(
      // todo maybe change time
      "CREATE TABLE IF NOT EXISTS CARD_CLAIMS (id BIGSERIAL PRIMARY KEY, server_id BIGINT, discord_id VARCHAR, card_id VARCHAR, issue INT, tier VARCHAR, from_cylce BOOLEAN DEFAULT FALSE, time BIGINT)"
    );
  }
}
module.exports = PgApi;
