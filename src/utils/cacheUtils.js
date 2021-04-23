const got = require("got");

const getCachedURL = async (instance, url) => {
  const k = `curi:${url.split("/").slice(-1)}`;
  const exists = await instance.cache.exists(k);

  if (exists) {
    const e = await instance.cache.get(k);
    return e;
  }

  const r = await got(url, {
    dnsCache: true,
    http2: true,
    responseType: "buffer",
  });
  const data = r.body.toString("base64");
  instance.cache.setExpire(k, data, 86400);
  return data;
};

module.exports = {
  getCachedURL,
};
