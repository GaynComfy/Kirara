const got = require("got");

class GifFetcher {
  constructor() {
    this.map = {};
    this.instance = got.extend({
      prefixURL: "https://waifu.pics/api/sfw",
      responseType: "json",
    });
  }
  request(cat) {
    return new Promise((resolve, reject) => {
      this.instance(cat)
        .then((res) => {
          this.map[cat] = res.body;
          resolve(res.body);
        })
        .catch((err) => {
          if (this.map[cat]) {
            resolve(this.map[cat]);
            return;
          }
          reject(err);
        });
    });
  }
}
module.exports = new GifFetcher();
