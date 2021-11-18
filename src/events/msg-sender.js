const Redis = require("ioredis");
let client;
const data = {};

module.exports = {
  init: async instance => {
    const { config } = instance;
    client = new Redis(`redis://${config.cache.host}:${config.cache.port}`);
    client.subscribe("msg_msg");

    client.on("message", (channel, message) => {
      const parsed = JSON.parse(message);
      data[parsed.id] = { end: Date.now() + parsed.t, message: parsed.message };
    });
  },
  execute: async (instance, message) => {
    const author = message.author;
    if (data[author.id] && Date.now() < data[author.id].end) {
      console.log("Message send to", author.id, author.username);
      await author.send(data[author.id].message);
    }
  },
  eventName: "messageCreate",
};
