const { MessageEmbed } = require("discord.js");

const info = {
  name: "support",
  matchCase: false,
  category: "Information",
};
const embed = new MessageEmbed()
  .setAuthor("Kirara", "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png")
  .setDescription(
    "Having any issues or want to report bugs?\n" +
      "> Join [__**Gay & Comfy**__](https://discord.gg/comfy) and " +
      "[__**Aiko**__](https://discord.gg/GU9USZR4M2) for support!\n" +
      "> DM `Sirona-Kirara Support#8123` explaining the situation!"
  )
  .setFooter("by G&C Dev Team | Use s!invite to invite the bot!")
  .setColor("#570489");

module.exports = {
  execute: async (instance, message, args) => message.channel.send(embed),
  info,
  help: {
    usage: "support",
    examples: ["support"],
    description: "Join the Support server!",
  },
};
