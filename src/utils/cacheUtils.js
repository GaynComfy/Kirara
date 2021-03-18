const axios = require("axios");

const getCachedURL = async (instance, url) => {
  const k = `url:${url.split("/").slice(-1)}`;
  const exists = await instance.cache.exists(k);

  if (exists) {
    const e = await instance.cache.get(k);
    return e;
  }

  const r = await axios.get(url, { responseType: "arraybuffer" });
  const data = Buffer.from(r.data).toString("base64");
  instance.cache.setExpire(k, data, 604800);
  return data;
};

module.exports = {
  getCachedURL,
};
