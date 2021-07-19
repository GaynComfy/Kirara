const axios = require("axios");

const getCachedURL = async (instance, url) => {
  const k = `url:${Buffer.from(url).toString("base64")}`;
  const exists = await instance.cache.exists(k);

  if (exists) {
    const e = await instance.cache.get(k, true);
    return e;
  }

  let r;

  try {
    r = await axios.get(url, { responseType: "arraybuffer" });
  } catch (err) {
    console.error(err);
    return "./src/assets/default/0.png";
  }
  instance.cache.setExpire(k, r.data, 604800);
  return r.data;
};

const getOptOutStmt = idColumn =>
  `NOT EXISTS (SELECT id FROM USER_SETTINGS WHERE USER_SETTINGS.key = 'lb-optout' AND USER_SETTINGS.discord_id=${idColumn})`;

module.exports = {
  getCachedURL,
  getOptOutStmt,
};
