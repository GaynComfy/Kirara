const axios = require("axios").default;

const httpClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    Origin: "https://sofi.gg",
    referer: "https://sofi.gg/",
  },
});

const getProfile = async (instance, id, force = false) => {
  if (!force) {
    const exists = await instance.cache.get(`sofi_profile:${id}`);
    if (exists) {
      return JSON.parse(exists);
    }
  }
  try {
    // TODO: this might break in the future?
    const result = await httpClient.get(
      `https://sofi.gg/_next/data/_V35JrE__8s-ZOzLGk3rj/en/profile/${id}.json?userId=${id}`
    );
    instance.cache.setExpire(
      `sofi_profile:${id}`,
      JSON.stringify(result.data),
      60 * 60
    ); // one hour
    return result.data;
  } catch (err) {
    return null;
  }
};
const getCardStats = async (instance, id, force = false) => {
  if (!force) {
    const exists = await instance.cache.get(`sofi_card_stat:${id}`);
    if (exists) {
      return JSON.parse(exists);
    }
  }
  try {
    // TODO: this might break in the future?
    const result = await httpClient.get(
      `https://api.sofi.gg/profile/card-stats?userId=${id}`
    );
    instance.cache.setExpire(
      `sofi_card_stat:${id}`,
      JSON.stringify(result.data),
      60 * 60
    ); // one hour
    return result.data;
  } catch (err) {
    return null;
  }
};
const getFollowers = async (instance, id, force = false) => {
  if (!force) {
    const exists = await instance.cache.get(`sofi_followers:${id}`);
    if (exists) {
      return JSON.parse(exists);
    }
  }
  try {
    // TODO: this might break in the future?
    const result = await httpClient.get(
      `https://api.sofi.gg/profile/followers/${id}`
    );
    instance.cache.setExpire(
      `sofi_followers:${id}`,
      JSON.stringify(result.data),
      60 * 60
    ); // one hour
    return result.data;
  } catch (err) {
    return null;
  }
};
module.exports = {
  getProfile,
  getCardStats,
  getFollowers,
  URLS: {
    github: [`https://github.com/`, "Github"],
    instagram: [`https://instagram.com/`, "Instagram"],
    twitter: [`https://twitter.com/`, "Twitter"],
  },
};
