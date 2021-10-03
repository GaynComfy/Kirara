const axios = require("axios").default;

const getCachedURL = async (instance, url) => {
  const k = `url:${Buffer.from(url).toString("base64")}`;
  const exists = await instance.cache.exists(k);

  if (exists) return await instance.cache.get(k, true);

  try {
    let r = await axios.get(url, { responseType: "arraybuffer" });
    instance.cache.setExpire(k, r.data, 86400);
    return r.data;
  } catch (err) {
    console.error(err);
    return "./assets/imagees/default/0.png";
  }
};

const getOptOutStmt = idColumn =>
  `NOT EXISTS (SELECT id FROM USER_SETTINGS WHERE USER_SETTINGS.key = 'lb-optout' AND USER_SETTINGS.discord_id=${idColumn})`;

module.exports = {
  getCachedURL,
  getOptOutStmt,
};
