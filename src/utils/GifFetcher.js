const axios = require("axios").default;
const QuickLRU = require("quick-lru");

class GifFetcher {
  constructor() {
    this.map = {};
    this.last = new QuickLRU({ maxSize: 15, maxAge: 15000 });
    this.instance = axios.create({
      baseURL: "https://api.waifu.pics/sfw",
      timeout: 1000,
    });
    // pre-cache map
    this.cache().catch(console.error);
  }
  request(type, cid) {
    return new Promise((resolve, reject) => {
      const k = `${cid}:${type}`;
      const data = this.map[type];
      const canResolve = data && this.last.get(k) !== data;
      if (canResolve) {
        this.last.set(k, data);
        resolve(data);
      }

      this.get(type)
        .then(data => {
          if (!canResolve) {
            this.last.set(k, this.map[type]);
            resolve(data);
          }
        })
        .catch(err => {
          console.error(err);
          if (this.map[type]) resolve(this.map[type]);
          else if (!canResolve) reject(err);
        });
    });
  }
  async get(type) {
    const { data } = await this.instance.get(`/${type}`);
    if (!data || !data.url) {
      throw new Error(
        `No data received from Waifu.pics: ${JSON.stringify(data)}`
      );
    }

    this.map[type] = data;
    return data;
  }
  async cache() {
    const endpoints = await axios.get("https://api.waifu.pics/endpoints");
    if (!endpoints.data) {
      return console.error("could not pre-cache Waifu.pics images");
    }
    const { sfw } = endpoints.data;
    const result = await Promise.all(
      sfw.map(type =>
        axios.get(`https://api.waifu.pics/sfw/${type}`).catch(() => null)
      )
    );
    sfw.forEach((type, i) => {
      const { data } = result[i];
      if (!data || !data.url) return;
      this.map[type] = data;
    });
  }
}
module.exports = new GifFetcher();
