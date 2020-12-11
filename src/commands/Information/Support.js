const { MessageEmbed } = require("discord.js");

const info = {
  name: "support",
  matchCase: false,
  category: "Information",
};
const InviteEmbed = new MessageEmbed()
  .setAuthor("Kirara", "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png")
  .setDescription(
    "Having any issues or want to report bugs?\n> [__**Click me**__](https://discord.gg/comfy) " +
      "and [__**Click me**__](https://discord.gg/GU9USZR4M2) for support!"
  )
  .setFooter("by G&C Dev Team | Use s!invite to invite the bot!")
  .setColor("#570489");

module.exports = {
  execute: async (instance, message, args) => {
    message.channel.send(InviteEmbed);
  },
  info,
  help: {
    usage: "support",
    examples: ["support"],
    description: "Join the Support server!",
  },
};
