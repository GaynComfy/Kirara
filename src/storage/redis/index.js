const Redis = require("ioredis");
const RedisApi = require("./Api");

module.exports.RedisAPI = config => {
  return new Promise((resolve, reject) => {
    const client = new Redis(config);
    client.once("ready", () => resolve(new RedisApi(client, config)));
    client.once("error", error => reject(error));
  });
};

module.exports.RedisEvents = config => {
  return new Promise((resolve, reject) => {
    const client = new Redis(config);
    client.once("ready", () => resolve(client));
    client.once("error", error => reject(error));
  });
};
