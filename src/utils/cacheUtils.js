const got = require("got");

const getCachedURL = async (instance, url) => {
  const k = `curl:${url.split("/").slice(-1)}`;
  const exists = await instance.cache.exists(k);

  if (exists) {
    const e = await instance.cache.get(k, true);
    return e;
  }

  const r = await got(url, {
    dnsCache: true,
    http2: true,
    responseType: "buffer",
  });
  instance.cache.setExpire(k, r.body, 86400);
  return r.body;
};

module.exports = {
  getCachedURL,
};
