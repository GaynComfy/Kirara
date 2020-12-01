const { Pool } = require("pg");
const PgApi = require("./Api");

module.exports = (config, isProd) => {
  return new Promise((resolve, reject) => {
    const connectionProps = {
      user: config.database.user,
      host: config.database.host,
      database: config.database.database,
      port: config.database.port,
    };
    if (isProd || config.database.password || process.env.PG_PASSWORD) {
      connectionProps.password =
        config.database.password || process.env.PG_PASSWORD || null;
    }
    const pool = new Pool(connectionProps);
    resolve(new PgApi(pool, config.database));
  });
};
