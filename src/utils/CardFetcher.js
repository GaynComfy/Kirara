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
  async fetchByName(instance, name, tier = "all", event = false) {
    const k = `cardsearch${
      event ? ":event" : ""
    }:${tier}:${name.toLowerCase().replace(/ /g, "-")}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `/${event ? "eventcards" : "card"}/name/${name}${
        tier === "all" ? "" : `?tier=${tier}`
      }`
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
  async fetchByID(instance, id, event = false) {
    const k = `card${event ? ":event" : ""}:${id}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `/${event ? "eventcards" : "card"}/${id}`
    );
    if (result.data.length === 0) {
      return null;
    }
    const card = result.data;
    instance.cache.setExpire(k, JSON.stringify(card), 60 * 30);
    return card;
  }
  async fetchInventory(instance, id, tier, page) {
    const k = `inventory:${id}:${tier || "all"}:${page}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = tier
      ? await this.instance.get(
          `/inventory/user/${id}/${tier}?offset=${page}&limit=8`
        )
      : await this.instance.get(`/inventory/user/${id}?offset=${page}&limit=8`);

    if (result.data.length === 0) {
      return [];
    }
    const cards = result.data;
    instance.cache.setExpire(k, JSON.stringify(cards), 60 * 14);
    return cards;
  }
  async fetchOwners(instance, id, limit = "0") {
    const k = `cardowners:${id}:${limit}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `/inventory/card/${id}${limit === "0" ? "" : `?limit=${limit}`}`
    );
    if (result.data.length === 0) {
      return [];
    }
    const cards = result.data;
    instance.cache.setExpire(k, JSON.stringify(cards), 60 * 30);
    return cards;
  }
}
module.exports = new CardFetcher(process.env.AS_TOKEN);
