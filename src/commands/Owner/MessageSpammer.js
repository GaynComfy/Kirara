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
        const t = 1000 * 60 * Number.parseInt(args.shift());
        const message = args.join(" ");
        client.publish("msg_msg", JSON.stringify({ id, t, message }));
        message.reply("done");
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
