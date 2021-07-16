// This processes claims as we get them based on Shoob's sent embeds.
// This will work in case an API request gets lost, midori is down,
// or they break the bot as they did in the Shoob 2 rewrite.
// Fuck AS. -JeDaYoshi
const Redis = require("ioredis");

let client = null;
let deleteInterval = null;
let cleanupInterval = null;

module.exports = {
  start: async instance => {
    if (!instance.shared["spawn"]) instance.shared["spawn"] = {};
    if (!instance.shared["spawnDelete"]) instance.shared["spawnDelete"] = {};

    // Redis client (yes, we submit claims so the same bot handles it...
    // very efficient I know. but to be fair, it's the best to balance it.)
    const { config } = instance;
    client = new Redis(`redis://${config.cache.host}:${config.cache.port}`);
  },
  stop: async () => {
    if (deleteInterval) clearInterval(deleteInterval);
    if (cleanupInterval) clearInterval(cleanupInterval);
    if (client !== null) {
      client.end(true);
      client = null;
    }
  },
};
