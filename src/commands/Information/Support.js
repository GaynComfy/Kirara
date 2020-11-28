const { MessageEmbed } = require("discord.js");

const info = {
  name: "support",
  matchCase: false,
  category: "Information",
  cooldown: 60,
};
const InviteEmbed = new MessageEmbed()
  .setAuthor(
    "Kirara",
    "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png"
  )
  .setDescription(
    "Want more help or want to report bugs?\n> [__**Click Me**__](https://discord.gg/comfy) and [__**Click Me**__](https://discord.gg/GU9USZR4M2) for more support!"
  )
  .setFooter("by G&C Dev Team | Use s!invite to invite the bot!")
  .setColor("RANDOM");

module.exports = {
  execute: async (instance, message, args) => {
    message.channel.send(InviteEmbed);
  },
  info,
  help: {
    usage: "support",
    examples: ["suport"],
    description: "Join the Support server!",
  },
};
