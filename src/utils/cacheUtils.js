const axios = require("axios");

const getCachedURL = async (instance, url) => {
  const k = url.split("/").slice(-1);
  const exists = await instance.cache.exists(k);

  if (exists) {
    const e = await instance.cache.get(k);
    return `data:image/png;base64,${e.toString("base64")}`;
  }

  const r = await axios.get(url, { responseType: "buffer" });
  instance.cache.setExpire(k, r.data, 604800);
  return `data:image/png;base64,${r.data.toString("base64")}`;
};

module.exports = {
  getCachedURL,
};
