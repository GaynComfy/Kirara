const axios = require("axios");
class CardFetcher {
  constructor(token) {
    this.instance = axios.create({
      baseURL: "https://asn-api.animesoul.com/v1",
      headers: {
        Authorization: token,
      },
    });
  }
  async fetchByName(instance, name, tier = "all") {
    const k = `cardsearch:${tier}:${name.toLowerCase().replace(/ /g, "-")}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `/card/name/${name}${tier === "all" ? "" : "?tier=" + tier}`
    );
    if (result.data.length === 0) {
      return null;
    }
    const card =
      result.data.find((e) => e.name.toLowerCase() === name.toLowerCase()) ||
      result.data[0];
    instance.cache.setExpire(k, JSON.stringify(card), 60 * 30);
    return card;
  }
}
module.exports = new CardFetcher(process.env.AS_TOKEN);
