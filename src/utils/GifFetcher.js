const axios = require("axios").default;

class GifFetcher {
  constructor() {
    this.map = {};
    this.instance = axios.create({
      baseURL: "https://api.waifu.pics/sfw",
      timeout: 500,
    });
  }
  request(type) {
    return new Promise((resolve, reject) => {
      this.instance
        .get(`/${type}`)
        .then(res => {
          this.map[type] = res.data;
          resolve(res.data);
        })
        .catch(err => {
          if (this.map[type]) {
            resolve(this.map[type]);
            return;
          }
          reject(err);
        });
    });
  }
}
module.exports = new GifFetcher();
