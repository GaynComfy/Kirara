const got = require("got");

const tN = tier => (tier.toLowerCase() === "s" ? 8 : parseInt(tier));
const sortTopOwners = arr => {
  return arr
    .sort((a, b) => {
      const nA = a.username.toUpperCase();
      const nB = b.username.toUpperCase();
      if (nA < nB) return -1;
      if (nA > nB) return 1;
      return 0;
    })
    .sort((a, b) => {
      if (a.issues[0].issue < b.issues[0].issue) return -1;
      if (a.issues[0].issue > b.issues[0].issue) return 1;
      return 0;
    })
    .sort((a, b) => {
      if (a.count > b.count) return -1;
      if (a.count < b.count) return 1;
      return 0;
    });
};

class CardFetcher {
  constructor(token) {
    this.instance = got.extend({
      prefixUrl: "https://asn-api.animesoul.com/v1",
      headers: {
        Authorization: token,
      },
      responseType: "json",
      throwHttpErrors: false,
      dnsCache: true,
      http2: true,
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
    const result = await this.fetchAllByName(instance, name, tier, event);
    if (!result || result.length === 0) {
      return null;
    }
    const card =
      result.find(e => e.name.toLowerCase() === name.toLowerCase()) ||
      result[0];
    instance.cache.setExpire(k, JSON.stringify(card), 60 * 30);
    return card;
  }
  async fetchAllByName(instance, name, tier = "all", event = false) {
    const k = `cardlist${
      event ? ":event" : ""
    }:${tier}:${name.toLowerCase().replace(/ /g, "-")}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `${event ? "eventcards" : "card"}/name/${encodeURI(name)}${
        tier === "all" ? "" : `?tier=${tier}`
      }`
    );
    if (
      !result.body ||
      result.body.length === 0 ||
      result.body.message ||
      result.body === "Not Found"
    ) {
      return [];
    }
    const cards = result.body
      .sort((l, n) => tN(n.tier) - tN(l.tier))
      .map(c => {
        return { ...c, event };
      });
    instance.cache.setExpire(k, JSON.stringify(cards), 60 * 30);
    return cards;
  }
  async fetchById(instance, id, event = false) {
    const k = `card${event ? ":event" : ""}:${id}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `${event ? "eventcards" : "card"}/${id}`
    );
    if (
      !result.body ||
      result.body.length === 0 ||
      result.body.message ||
      result.body.id === "000000000000000000000000"
    ) {
      return null;
    }
    const card = { ...result.body, event };
    instance.cache.setExpire(k, JSON.stringify(card), 60 * 30);
    return card;
  }
  async fetchInventory(
    instance,
    id,
    tier,
    offset = "0",
    limit = "0",
    cardId = null
  ) {
    const k = `inventory:${id}:${tier || "all"}:${
      cardId || "all"
    }:${offset}:${limit}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result =
      tier && !cardId
        ? await this.instance.get(
            `inventory/user/${id}/${tier}?offset=${offset}${
              limit === "0" ? "" : `&limit=${limit}`
            }`
          )
        : await this.instance.get(
            `inventory/user/${id}?offset=${offset}${
              limit === "0" ? "" : `&limit=${limit}`
            }${cardId ? `&card=${cardId}` : ""}`
          );

    if (!result.body || result.body.length === 0 || result.body.message) {
      return [];
    }
    const cards = result.body;
    instance.cache.setExpire(k, JSON.stringify(cards), 60 * 14);
    return cards;
  }
  async fetchByTier(instance, tier, offset = "0", limit = "0", event = false) {
    const k = `cards${event ? ":event" : ""}:${tier}:${offset}:${limit}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `${event ? "eventcards" : "cards"}/tier/${tier}?offset=${offset}${
        limit === "0" ? "" : `&limit=${limit}`
      }`
    );
    if (!result.body || result.body.length === 0 || result.body.message) {
      return [];
    }
    instance.cache.setExpire(k, JSON.stringify(result.body), 60 * 5);
    return result.body;
  }
  async fetchAuctionById(instance, id) {
    const result = await this.instance.get(`auction/${id}`);
    if (!result.body || result.body.length === 0 || result.body.message) {
      return null;
    }
    const auction = result.body;
    return auction;
  }
  async fetchAuctionByInvId(instance, id) {
    const result = await this.instance.get(`auctions/card/${id}`);
    if (!result.body || result.body.length === 0 || result.body.message) {
      return null;
    }
    const listings = result.body;
    return listings;
  }
  async fetchMarketByCardId(instance, id, offset = "0", limit = "0") {
    const result = await this.instance.get(
      `market/card/${id}?offset=${offset}${
        limit === "0" ? "" : `&limit=${limit}`
      }`
    );
    if (!result.body || result.body.length === 0 || result.body.message) {
      return [];
    }
    const listings = result.body;
    return listings;
  }
  async fetchOwners(instance, id, offset = "0", limit = "0") {
    const k = `cardowners:${id}:${offset}:${limit}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `inventory/card/${id}?offset=${offset}${
        limit === "0" ? "" : `&limit=${limit}`
      }`
    );
    if (!result.body || result.body.length === 0 || result.body.message) {
      return [];
    }
    const owners = result.body.sort((l, n) => l.issue - n.issue);
    instance.cache.setExpire(k, JSON.stringify(owners), 60 * 14);
    return owners;
  }
  async fetchCardCount(instance, cardId) {
    const k = `cardcount:${cardId}`;
    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      const data = JSON.parse(e);
      return data.count;
    }
    const result = await this.instance.get(`inventory/count/${cardId}`);
    instance.cache.setExpire(k, JSON.stringify(result.body), 60 * 14);
    return result.body.count;
  }

  async fetchMarket(instance, offset, tier = "all") {
    const k = `market:${offset}:${tier}`;
    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(
      `market?offset=${offset}&limit=6${tier !== "all" ? `&tier=${tier}` : ""}`
    );
    instance.cache.setExpire(k, JSON.stringify(result.body), 60 * 5);
    return result.body;
  }

  async fetchTopOwners(instance, id, offset = "0", limit = "0") {
    // this can be so aggressive I am better processing it this way.
    // reduce queries on Anime Soul but fetch all data time
    const k = `cardtopowners:${id}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      const data = JSON.parse(e);
      return sortTopOwners(
        data.slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      );
    }
    const result = await this.instance.get(`inventory/top/${id}`);
    if (!result.body || result.body.length === 0 || result.body.message) {
      return [];
    }
    const owners = result.body;
    instance.cache.setExpire(k, JSON.stringify(owners), 60 * 14);
    return sortTopOwners(
      owners.slice(parseInt(offset), parseInt(offset) + parseInt(limit))
    );
  }

  // why is this here lol
  async fetchProfile(instance, id) {
    const k = `user:${id}`;
    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }
    const result = await this.instance.get(`user/${id}`);
    if (!result.body || result.body.length === 0 || result.body.message) {
      return null;
    }
    instance.cache.setExpire(k, JSON.stringify(result.body), 30);
    return result.body;
  }
}

module.exports = new CardFetcher(process.env.AS_TOKEN);
