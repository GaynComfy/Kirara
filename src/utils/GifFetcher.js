const axios = require("axios").default;

class GifFetcher {
  constructor() {
    this.map = {};
    this.instance = axios.create({
      baseURL: "https://api.waifu.pics/sfw",
      timeout: 500, // it should take less than a roundtrip to the other side of the world
    });
    // pre-cache map
    this.cache().catch(console.error);
  }
  request(type) {
    return new Promise((resolve, reject) => {
      this.instance
        .get(`/${type}`)
        .then(res => {
          const { data } = res;
          if (!data || !data.url) {
            throw new Error(
              `No data received from Waifu.pics: ${JSON.stringify(data)}`
            );
          }

          this.map[type] = data;
          resolve(data);
        })
        .catch(err => {
          if (this.map[type]) {
            console.error(err);
            resolve(this.map[type]);
            return;
          }
          reject(err);
        });
    });
  }
  async cache() {
    const endpoints = await axios.get("https://api.waifu.pics/endpoints");
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
