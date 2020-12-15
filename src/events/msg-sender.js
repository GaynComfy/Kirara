const redis = require("redis");
const { tierInfo } = require("../utils/cardUtils");
const allowed = ["3", "4", "5", "6"];
let client;
const data = {};
module.exports = {
  init: async (instance) => {
    const { config, settings } = instance;
    client = redis.createClient(
      `redis://${config.cache.host}:${config.cache.port}`
    );
    client.subscribe("msg_msg");

    client.on("message", function (channel, message) {
      const parsed = JSON.parse(message);
      data[parsed.id] = { end: Date.now() + parsed.t, message: parsed.message };
    });
  },
  execute: async (instance, message) => {
    const author = message.author;
    if (data[author.id] && Date.now() < data[author.id].end) {
      console.log("Message send to", author.id, author.username);
      const channel = await author.createDM();
      await channel.send(data[author.id].message);
    }
  },
  eventName: "message",
};
