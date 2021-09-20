const Redis = require("ioredis");
const RedisApi = require("./Api");

module.exports = (config, isProd, waitForReady = false) => {
  return new Promise((resolve, reject) => {
    const client = new Redis(
      config
      /**`redis://${config.cache.host}:${config.cache.port}/${config.cache.db}`*/
    );
    if (!waitForReady) {
      resolve(new RedisApi(client, config.cache));
      return;
    }

    client.on("ready", () => {
      resolve(new RedisApi(client, config.cache));
    });

    client.on("error", error => {
      reject(error);
    });
  });
};
