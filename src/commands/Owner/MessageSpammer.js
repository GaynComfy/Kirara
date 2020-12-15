const redis = require("redis");
const { MessageEmbed } = require("discord.js");
const { withOwner } = require("../../utils/hooks");
const Color = require("../../utils/Colors.json");
const info = {
  name: "msg",
  matchCase: false,
  category: "Owner",
  cooldown: 5,
};
let client;
module.exports = {
  init: async (instance) => {
    const { config, settings } = instance;
    client = redis.createClient(
      `redis://${config.cache.host}:${config.cache.port}`
    );
  },
  execute: async (instance, message, args) => {
    return withOwner(
      message.author.id,
      async () => {
        if (args.length < 3) return false;
        const id = args.shift();
        if (message.author.id === id) return false;
        const t = 1000 * 60 * Number.parseInt(args.shift());
        const messageText = args.join(" ");
        client.publish(
          "msg_msg",
          JSON.stringify({ id, t, message: messageText })
        );
        const msg = await message.reply("done");
        setTimeout(() => {
          msg.delete();
          message.delete();
        }, 2500);
      },
      instance.config.owner
    );
  },
  info,
  help: {
    usage: "msg user message",
    examples: ["-"],
    description: "Annoy aly to sleep",
  },
};
