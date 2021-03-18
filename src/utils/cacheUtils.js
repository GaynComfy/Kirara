const axios = require("axios");

const getCachedURL = async (instance, url) => {
  const k = url.split("/").slice(-1).toString("base64");
  const exists = await instance.cache.exists(k);

  if (exists) {
    const e = await instance.cache.get(k);
    return e;
  }

  const r = await axios.get(url, { responseType: "arraybuffer" });
  const data = Buffer.from(r.data);
  instance.cache.setExpire(k, r.data, 604800);
  return r.data;
};

module.exports = {
  getCachedURL,
};
