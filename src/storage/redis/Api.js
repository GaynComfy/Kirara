const redis = require("redis");

class RedisApi {
  /**
   *
   * @param {redis.RedisClient} client
   * @param {*} config
   */
  constructor(client, config) {
    this.client = client;
    this.config = config;
  }
}
module.exports = RedisApi;
