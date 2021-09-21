const Redis = require("ioredis");
const RedisApi = require("./Api");

module.exports = config => {
  return new Promise((resolve, reject) => {
    const client = new Redis(config);
    client.once("ready", () => resolve(new RedisApi(client, config)));
    client.once("error", error => reject(error));
  });
};
