const axios = require("axios");
const axiosRetry = require("axios-retry");

axiosRetry(axios, { retries: 3 });

const getCachedURL = async (instance, url) => {
  const k = `url:${url.split("/").slice(-1)}`;
  const exists = await instance.cache.exists(k);

  if (exists) {
    const e = await instance.cache.get(k, true);
    return e;
  }

  const r = await axios.get(url, { responseType: "arraybuffer" });
  instance.cache.setExpire(k, r.data, 86400);
  return r.data;
};

module.exports = {
  getCachedURL,
};
