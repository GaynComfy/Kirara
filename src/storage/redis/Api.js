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
    return this.client.exists(key);
  }
  set(key, value) {
    return this.client.set(key, value);
  }
  increment(key, n) {
    return this.client.incr(key, n)
  }
  decrementBy(key, n) {
    return this.client.decrby(key, n)
  }
  incrementBy(key, n) {
    return this.client.incrby(key, n)
  }
  setExpire(key, value, timeout) {
    return this.client.setex(key, timeout, value);
  }
  get(key, buffer = false) {
    if (buffer === true) return this.client.getBuffer(key);
    return this.client.get(key);
  }
  delete(key) {
    return this.client.del(key);
  }
  keys(key) {
    return this.client.keys(key);
  }
}
module.exports = RedisApi;
