const axios = require("axios").default;

class GifFetcher {
  constructor() {
    // add some fallbacks in case we lag on start
    this.map = {
      hug: { url: "https://i.waifu.pics/HWhukIP.gif" },
      neko: { url: "https://i.waifu.pics/Qyr5N-~.png" },
      pat: { url: "https://i.waifu.pics/vAcG_hT.gif" },
      bonk: { url: "https://i.waifu.pics/XCxAgkz.gif" },
      wave: { url: "https://i.waifu.pics/Jvi3~TN.gif" },
      yeet: { url: "https://i.waifu.pics/9CeCIw4.gif" },
      awoo: {
        url: "https://cdn.discordapp.com/attachments/690981388299665478/808348212456194108/alydrip.png",
      },
      lick: { url: "https://i.waifu.pics/p0FcuY4.gif" },
      kiss: { url: "https://i.waifu.pics/ROlkkMZ.gif" },
      handhold: { url: "https://i.waifu.pics/gsFX6IT.gif" },
    };
    this.instance = axios.create({
      baseURL: "https://api.waifu.pics/sfw",
      timeout: 400, // it should take less than a roundtrip to the other side of the world
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
            console.error(err);
            resolve(this.map[type]);
            return;
          }
          reject(err);
        });
    });
  }
}
module.exports = new GifFetcher();
