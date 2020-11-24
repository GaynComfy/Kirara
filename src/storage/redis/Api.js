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

  exists(key) {
    return new Promise((resolve, reject) => {
      this.client.exists(key, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result === 1);
      });
    });
  }
  set(key, value) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }
  setExpire(key, value, timeout) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, timeout, value, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }
  get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }
  delete(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }
  keys(key) {
    return new Promise((resolve, reject) => {
      this.client.keys(key, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }
}
module.exports = RedisApi;
